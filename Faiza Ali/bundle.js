(function (React$1, ReactDOM, d3$1) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && Object.prototype.hasOwnProperty.call(ReactDOM, 'default') ? ReactDOM['default'] : ReactDOM;

  const bandwidth = 10;

  const precision = 1e-6;

  const blur = (data, property) => {
    const s = gaussianSmoothing(
      data.map((d) => d[property]),
      bandwidth
    );
    return data.map((d, i) => {
      d[property] = isNaN(s[i]) ? 0 : s[i];
      return d;
    });
  };

  function applyKernel(points, w) {
    const values = new Float64Array(points.length).fill(0),
      total = new Float64Array(points.length).fill(0);
    let p = 1;
    for (let d = 0; p > precision; d++) {
      p = w(d);
      for (let i = 0; i < points.length; i++) {
        if (i + d < points.length) {
          values[i + d] += p * points[i];
          total[i + d] += p;
        }
        if (d != 0 && i - d >= 0) {
          values[i - d] += p * points[i];
          total[i - d] += p;
        }
      }
    }
    for (let i = 0; i < values.length; i++) {
      values[i] /= total[i];
    }
    return values;
  }

  function gaussianSmoothing(values, N) {
    const r = 2 / N;
    return applyKernel(values, (d) => Math.exp(-((r * d) ** 2)));
  }

  // Number of countries to show (Top-n).
  const n = 50;
  
  const csvUrl =
    'https://raw.githubusercontent.com/FaizaAlii/csvFile/90ea58a10963e9f99b743216a042d5f41f5abe17/exports_Test.csv';

  d3.csv(csvUrl,
    d3.autoType)
    .then(function (data) {
      console.log(data)
      // console.table(data)
    })
  ;

    const transform = (rawData) => {
      // Filter out rows that represent Country Groups.
      const countryGroup = rawData.filter((d) => !d['Country Group']);

      // Get the commodity code each country group.
      const codes = rawData.columns.slice(4, 10);
      const transformed = countryGroup.map((d) => {
            const commodity = d['Commodity'];
            const commodityCode = d['Commodity Code'];
            const exportUnits = d['Export Units'];
            const exportWeight = d['Export Weight'];
            const exportValue = d['Export Value'];
            const reExportUnits= d['Re Export Units'];
            const reExportWeight = d['Re Export Weight'];
            const reExportValue = d['ReExport Value'];
            const totalUnits = d['Total Units'];
            const totalWeight= d['Total Weight'];
            const totalValue = d['Total Value'];
            const year = d['Year'];

            return{
              commodity,
              commodityCode,
              exportUnits,
              exportWeight,
              exportValue,
              reExportUnits,
              reExportWeight,
              reExportValue,
              totalUnits,
              totalWeight,
              totalValue,
              year,
            };


        const countryValueseriesBlurred = blur(
          totalValue);

        countryValueseriesBlurred.commodity = commodity;

        return countryValueseriesBlurred;
      });

      // Only include top values.
      const top = transformed
        .sort((a, b) =>
          d3$1.descending(a[a.length - 1].totalValue, b[b.length - 1].totalValue)
        )
        .slice(0, n);
      return top;
    };

    const useData = () => {
      const [data, setData] = React$1.useState();

      React$1.useEffect(() => {
        d3$1.csv(csvUrl).then((rawData) => {
          setData(transform(rawData));
        });
      }, []);
      return data;
    };

  //__________________ x,y ___________________
  const XAxis = ({ xScale, innerHeight }) => {
    const ref = React$1.useRef();
    React$1.useEffect(() => {
      const xAxisG = d3$1.select(ref.current);
      const xAxis = d3$1.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(18)
        .ticks(10);
      xAxisG.call(xAxis);
    }, [innerHeight, xScale]);
    return React.createElement( 'g', { transform: `translate(0,${innerHeight})`, ref: ref });
  };

  const YAxis = ({ yScale, innerWidth }) => {
    const ref = React$1.useRef();
    React$1.useEffect(() => {
      const yAxisG = d3$1.select(ref.current);
      const yAxis = d3$1.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(3)
        .ticks(10, "~s")
        .tickFormat((tickValue) => tickValue);
      yAxisG.call(yAxis);
    }, [innerWidth, yScale]);
    return React.createElement( 'g', { ref: ref });
  };

  const VoronoiOverlay = ({
    margin,
    innerWidth,
    innerHeight,
    allData,
    lineGenerator,
    onHover
  }) => {
    return React$1.useMemo(() => {
      const points = allData.map(d => [
        lineGenerator.x()(d),
        lineGenerator.y()(d)
      ]);
      const delaunay = d3.Delaunay.from(points);
      const voronoi = delaunay.voronoi([
        0,
        0,
        innerWidth + margin.right,
        innerHeight
      ]);
      return (
        React.createElement( 'g', { className: "voronoi" },
          points.map((point, i) => (
            React.createElement( 'path', {
              onMouseEnter: () => onHover(allData[i]), d: voronoi.renderCell(i) })
          ))
        )
      );
    }, [allData, lineGenerator, innerWidth, innerHeight, onHover]);
  };

  const xValue = (d) => d.year;
  const yValue = (d) => d.countryGroup;

  const margin = { top: 50, right: 40, bottom: 80, left: 100 };

  const formatDate = d3$1.timeFormat('%b %d, %Y');
  const formatComma = d3$1.format(',');

  const Tooltip = ({ activeRow, className }) => (
    React$1__default.createElement( 'text', { className: className, x: -10, y: -10, 'text-anchor': "end" },
     "Series ", activeRow.countryGroup, " (", activeRow.commodityCode, ") ", " cost ", activeRow.TotalValue, " SR."
    )
  );

  const LineChart = ({ data, width, height }) => {
    const [activeRow, setActiveRow] = React$1.useState();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const allData = React$1.useMemo(
      () =>
        data.reduce(
          (accumulator, totalValue) =>
            accumulator.concat(totalValue),
          []
        ),
      [data]
    );

    const epsilon = 1;

    const xScale = React$1.useMemo(
      () => d3$1.scaleTime().domain(d3$1.extent(allData, xValue)).range([0, innerWidth]),
      [allData, xValue]
    );

    const yScale = React$1.useMemo(
      () =>
        d3$1.scaleLog()
          .domain([epsilon, d3$1.max(allData, yValue)])
          .range([innerHeight, 0]),
      [epsilon, allData, yValue]
    );

    const lineGenerator = React$1.useMemo(
      () =>
        d3$1.line()
          .x((d) => xScale(xValue(d)))
          .y((d) => yScale(epsilon + yValue(d))),
      [xScale, xValue, yScale, yValue, epsilon]
    );

    const mostRecentDate = xScale.domain()[1];

    const handleVoronoiHover = React$1.useCallback(setActiveRow, []);

    return (
      React$1__default.createElement( 'svg', { width: width, height: height },
        React$1__default.createElement( 'g', { transform: `translate(${margin.left},${margin.top})` },
          React$1__default.createElement( XAxis, { xScale: xScale, innerHeight: innerHeight }),
          React$1__default.createElement( YAxis, { yScale: yScale, innerWidth: innerWidth }),
          data.map((countryGroup) => {
            return (
              React$1__default.createElement( 'path', {
                className: "marker-line", d: lineGenerator(countryGroup) })
            );
          }),
          React$1__default.createElement( 'text', { className: "title" }, "Creative and Responsive Charts (job interview By Faiza Ashker)"),
          React$1__default.createElement( 'text', {
            className: "axis-label", transform: `translate(-40,${innerHeight / 2}) rotate(-90)`, 'text-anchor': "middle" }, "Values(SR) Per Year"),
          React$1__default.createElement( 'text', {
            className: "axis-label", 'text-anchor': "middle", 'alignment-baseline': "hanging", transform: `translate(${innerWidth / 2},${innerHeight + 40})` }, "Year"),
          React$1__default.createElement( VoronoiOverlay, {
            margin: margin, onHover: handleVoronoiHover, innerHeight: innerHeight, innerWidth: innerWidth, allData: allData, lineGenerator: lineGenerator }),
          activeRow ? (
            React$1__default.createElement( React$1__default.Fragment, null,
              React$1__default.createElement( 'path', {
                className: "marker-line active", d: lineGenerator(
                  data.find(
                    (countryGroup) =>
                      countryGroup.commodity === activeRow.commodity
                  )
                ) }),
              React$1__default.createElement( 'g', {
                transform: `translate(${lineGenerator.x()(
                activeRow
              )},${lineGenerator.y()(activeRow)})` },
                React$1__default.createElement( 'circle', { r: 7 }),
                React$1__default.createElement( Tooltip, { activeRow: activeRow, className: "tooltip-stroke" }),
                React$1__default.createElement( Tooltip, { activeRow: activeRow, className: "tooltip" })
              )
            )
          ) : null
        )
      )
    );
  };

  const width = window.innerWidth;
  const height = window.innerHeight;

  const App = () => {
    const data = useData();
    return data
      ? React$1__default.createElement( LineChart, { data: data, width: width, height: height})
      : React$1__default.createElement( 'div', null, "Loading..." );
  };

  const rootElement = document.getElementById('root');
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, d3));
