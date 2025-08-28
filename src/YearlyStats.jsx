import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Hardcoded stats (2000–2025)
const yearlyData = [
  { year: 2025, publications: 35, unique_contributors: 25, average_authors_per_publication: 2.92 },
  { year: 2024, publications: 95, unique_contributors: 74, average_authors_per_publication: 4.13 },
  { year: 2023, publications: 81, unique_contributors: 61, average_authors_per_publication: 2.53 },
  { year: 2022, publications: 56, unique_contributors: 33, average_authors_per_publication: 2.8 },
  { year: 2021, publications: 32, unique_contributors: 23, average_authors_per_publication: 1.88 },
  { year: 2020, publications: 42, unique_contributors: 34, average_authors_per_publication: 4.2 },
  { year: 2019, publications: 42, unique_contributors: 34, average_authors_per_publication: 4.2 },
  { year: 2018, publications: 31, unique_contributors: 23, average_authors_per_publication: 2.38 },
  { year: 2017, publications: 57, unique_contributors: 32, average_authors_per_publication: 1.9 },
  { year: 2016, publications: 12, unique_contributors: 12, average_authors_per_publication: 1.71 },
  { year: 2015, publications: 29, unique_contributors: 23, average_authors_per_publication: 1.93 },
  { year: 2014, publications: 18, unique_contributors: 16, average_authors_per_publication: 2.57 },
  { year: 2013, publications: 23, unique_contributors: 18, average_authors_per_publication: 2.3 },
  { year: 2012, publications: 48, unique_contributors: 40, average_authors_per_publication: 2.09 },
  { year: 2011, publications: 38, unique_contributors: 25, average_authors_per_publication: 1.46 },
  { year: 2010, publications: 28, unique_contributors: 23, average_authors_per_publication: 1.33 },
  { year: 2009, publications: 44, unique_contributors: 26, average_authors_per_publication: 1.69 },
  { year: 2008, publications: 21, unique_contributors: 17, average_authors_per_publication: 1.24 },
  { year: 2007, publications: 52, unique_contributors: 25, average_authors_per_publication: 1.41 },
  { year: 2006, publications: 31, unique_contributors: 18, average_authors_per_publication: 1.29 },
  { year: 2005, publications: 55, unique_contributors: 35, average_authors_per_publication: 1.9 },
  { year: 2004, publications: 35, unique_contributors: 25, average_authors_per_publication: 1.67 },
  { year: 2003, publications: 21, unique_contributors: 18, average_authors_per_publication: 1.91 },
  { year: 2002, publications: 8, unique_contributors: 7, average_authors_per_publication: 1.33 },
  { year: 2001, publications: 11, unique_contributors: 9, average_authors_per_publication: 1.57 },
  { year: 2000, publications: 7, unique_contributors: 7, average_authors_per_publication: 2.33 },
];

function YearlyStats() {
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);

  // filter dataset based on range then sort ascending by year
  const filteredData = yearlyData
    .filter((item) => item.year >= startYear && item.year <= endYear)
    .slice() // shallow copy to avoid mutating original
    .sort((a, b) => a.year - b.year);

  // chart width calculation: give roughly 60px per year, min 800
  const chartWidth = Math.max(filteredData.length * 60, 800);

  // ticks for XAxis
  const ticks = filteredData.map((d) => d.year);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Yearly Statistics</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(Number(e.target.value))}
          placeholder="Start Year"
          min={2000}
          max={2025}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
        />
        <input
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(Number(e.target.value))}
          placeholder="End Year"
          min={2000}
          max={2025}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
        />
      </div>

      {filteredData.length === 0 ? (
        <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>No data for this range.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Publications Trend (scrollable) */}
          <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Publications Over Time</h3>
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 800 }}>
                <LineChart width={chartWidth} height={300} data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    ticks={ticks}
                    interval={0}
                    angle={-60}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="publications" stroke="#8884d8" name="Publications" />
                </LineChart>
              </div>
            </div>
          </div>

          {/* Unique Contributors (scrollable) */}
          <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Unique Contributors</h3>
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 800 }}>
                <BarChart width={chartWidth} height={300} data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    ticks={ticks}
                    interval={0}
                    angle={-60}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unique_contributors" fill="#82ca9d" name="Contributors" />
                </BarChart>
              </div>
            </div>
          </div>

          {/* Average Authors per Publication (scrollable) */}
          <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Avg. Authors per Publication</h3>
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 800 }}>
                <LineChart width={chartWidth} height={300} data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    ticks={ticks}
                    interval={0}
                    angle={-60}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average_authors_per_publication"
                    stroke="#ff7300"
                    name="Avg Authors"
                  />
                </LineChart>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YearlyStats;
