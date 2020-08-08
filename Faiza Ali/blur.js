const bandwidth = 10;

const precision = 1e-6;

export const blur = (data, property) => {
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
