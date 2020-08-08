import { useRef, useEffect } from 'react';
import { select, axisBottom, timeFormat } from 'd3';
const dateFormat = timeFormat("%-m/%-d")
export const XAxis = ({ xScale, innerHeight }) => {
  const ref = useRef();
  useEffect(() => {
    const xAxisG = select(ref.current);
    const xAxis = axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickPadding(18)
      .ticks(10)
      .tickFormat(dateFormat);
    xAxisG.call(xAxis);
  }, [innerHeight, xScale]);
  return <g transform={`translate(0,${innerHeight})`} ref={ref} />;
};
