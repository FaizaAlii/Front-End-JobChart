import React, { useCallback, useState, useMemo } from 'react';
import {
  scaleTime,
  extent,
  scaleLog,
  max,
  line,
  timeFormat,
  format,
  scaleBand,
} from 'd3';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';
import { VoronoiOverlay } from './VoronoiOverlay';
import { n } from './useData';

const xValue = (d) => d.date;
const yValue = (d) => d.deathDaily;

const margin = { top: 50, right: 40, bottom: 80, left: 100 };

const formatDate = timeFormat('%b %d, %Y');
const formatComma = format(',');

const Tooltip = ({ activeRow, className }) => (
  <text className={className} x={-10} y={-10} text-anchor="end">
    {activeRow.countryName}: Approximately {formatComma(activeRow.deathTotal)}{' '}
    {activeRow.deathTotal > 1 ? 'deaths' : 'death'} on{' '}
    {formatDate(activeRow.date)}
  </text>
);

export const LineChart = ({ data, width, height }) => {
  const [activeRow, setActiveRow] = useState();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allData = useMemo(
    () =>
      data.reduce(
        (accumulator, countryTimeseries) =>
          accumulator.concat(countryTimeseries),
        []
      ),
    [data]
  );

  const epsilon = 1;

  const xScale = useMemo(
    () => scaleTime().domain(extent(allData, xValue)).range([0, innerWidth]),
    [allData, xValue]
  );

  const yScale = useMemo(
    () =>
      scaleLog()
        .domain([epsilon, max(allData, yValue)])
        .range([innerHeight, 0]),
    [epsilon, allData, yValue]
  );

  const lineGenerator = useMemo(
    () =>
      line()
        .x((d) => xScale(xValue(d)))
        .y((d) => yScale(epsilon + yValue(d))),
    [xScale, xValue, yScale, yValue, epsilon]
  );

  const mostRecentDate = xScale.domain()[1];

  const handleVoronoiHover = useCallback(setActiveRow, []);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        <XAxis xScale={xScale} innerHeight={innerHeight} />
        <YAxis yScale={yScale} innerWidth={innerWidth} />
        {data.map((countryTimeseries) => {
          return (
            <path
              className="marker-line"
              d={lineGenerator(countryTimeseries)}
            />
          );
        })}
        <text className="title">
          Smoothed Daily Values Over Time by Country
        </text>
        <text
          className="axis-label"
          transform={`translate(-40,${innerHeight / 2}) rotate(-90)`}
          text-anchor="middle"
        >
          Daily Deaths (Smoothed)
        </text>
        <text
          className="axis-label"
          text-anchor="middle"
          alignment-baseline="hanging"
          transform={`translate(${innerWidth / 2},${innerHeight + 40})`}
        >
          Time
        </text>
        <VoronoiOverlay
          margin={margin}
          onHover={handleVoronoiHover}
          innerHeight={innerHeight}
          innerWidth={innerWidth}
          allData={allData}
          lineGenerator={lineGenerator}
        />
        {activeRow ? (
          <>
            <path
              className="marker-line active"
              d={lineGenerator(
                data.find(
                  (countryTimeseries) =>
                    countryTimeseries.countryName === activeRow.countryName
                )
              )}
            />
            <g
              transform={`translate(${lineGenerator.x()(
                activeRow
              )},${lineGenerator.y()(activeRow)})`}
            >
              <circle r={7} />
              <Tooltip activeRow={activeRow} className="tooltip-stroke" />
              <Tooltip activeRow={activeRow} className="tooltip" />
            </g>
          </>
        ) : null}
      </g>
    </svg>
  );
};
