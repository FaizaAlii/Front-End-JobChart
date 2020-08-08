import { useState, useEffect } from 'react';
import { csv, timeParse, descending } from 'd3';
import { blur } from './blur';

// Number of countries to show (Top-n).
export const n = 50;

// Number of iterations for Gaussian blur.
const numBlurIterations = 1;

//import { group } from 'd3-array';

//const csvUrl =
//  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/d1ed7ef35690594a918ed5fe1ffb6a75266d2c1f/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

const csvUrl =
  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

const sum = (accumulator, currentValue) => accumulator + currentValue;

const parseDay = timeParse('%m/%d/%y');

const transform = (rawData) => {
  // Filter out rows that represent provinces or states.
  const countriesData = rawData.filter((d) => !d['Province/State']);

  // Get timeseries data for each country.
  const days = rawData.columns.slice(4);
  const transformed = countriesData.map((d) => {
    const countryName = d['Country/Region'];

    let previousDayDeathTotal = +d[days[0]];
    const countryTimeseries = days.map((day) => {
      const deathTotal = +d[day];
      const deathDaily = Math.max(0, deathTotal - previousDayDeathTotal);
      previousDayDeathTotal = deathTotal;
      return {
        date: parseDay(day),
        deathTotal,
        deathDaily,
        countryName,
      };
    });

    const countryTimeseriesBlurred = blur(
      countryTimeseries,
      'deathDaily',
      numBlurIterations
    );

    countryTimeseriesBlurred.countryName = countryName;

    return countryTimeseriesBlurred;
  });

  // Only include top n.
  const top = transformed
    .sort((a, b) =>
      descending(a[a.length - 1].deathTotal, b[b.length - 1].deathTotal)
    )
    .slice(0, n);

  return top;
};

export const useData = () => {
  const [data, setData] = useState();

  useEffect(() => {
    csv(csvUrl).then((rawData) => {
      setData(transform(rawData));
    });
  }, []);

  return data;
};
