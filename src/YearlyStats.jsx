// YearlyStats.jsx
import React, { useEffect, useState } from "react";
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

/* ---------------- fixed options ---------------- */
const PUB_TYPES = ["Book Chapter", "Article", "Book"];
const AFFILIATIONS = ["IED", "Alumni/Student", "External", "PDCN", "PDCC"];

/* ---------------- backend config (edit if needed) ---------------- */
const BASE_URL = "http://127.0.0.1:8000";
const USERNAME = "admin";
const PASSWORD = "supersecretpassword";

/* ---------------- helpers ---------------- */
// ensure every year between start..end exists in the final data (no skipping)
function fillYearsWithZeros(statsArray, start, end) {
  const map = new Map(statsArray.map((s) => [Number(s.year), s]));
  const out = [];
  for (let y = start; y <= end; y++) {
    if (map.has(y)) {
      out.push(map.get(y));
    } else {
      out.push({
        year: y,
        publications: 0,
        unique_contributors: 0,
        average_authors_per_publication: 0,
      });
    }
  }
  return out;
}

/* ---------------- component ---------------- */
export default function YearlyStats() {
  // filter UI state
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);
  const [selectedPubTypes, setSelectedPubTypes] = useState([]);
  const [selectedAffiliations, setSelectedAffiliations] = useState([]);

  // data shown on charts + filters metadata
  const [data, setData] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // initial preview data (empty until request)
  useEffect(() => {
    setData([]);
    setFiltersApplied(null);
  }, []);

  // toggle helpers
  const toggle = (arr, setArr, item) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const resetAll = () => {
    setStartYear(2000);
    setEndYear(2025);
    setSelectedPubTypes([]);
    setSelectedAffiliations([]);
    setData([]);
    setFiltersApplied(null);
    setError("");
  };

  // Build query and call backend
  const requestStats = async () => {
    setError("");
    if (Number(startYear) > Number(endYear)) {
      setError("Start Year must be ≤ End Year.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();

      // only add years if provided (explicit check for empty string/undefined)
      if (startYear !== "" && startYear !== null && startYear !== undefined) {
        params.append("start_year", String(Number(startYear)));
      }
      if (endYear !== "" && endYear !== null && endYear !== undefined) {
        params.append("end_year", String(Number(endYear)));
      }

      // add multi-value filters: repeat the same query param for each value
      selectedPubTypes.forEach((pt) => params.append("publication_types", pt));
      selectedAffiliations.forEach((af) => params.append("affiliations", af));

      const url = `${BASE_URL}/statistics/publications?${params.toString()}`;

      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
        },
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Server returned ${resp.status}`);
      }

      const json = await resp.json();

      // backend returns {"statistics": [...], "filters_applied": {...}}
      let stats = Array.isArray(json.statistics) ? json.statistics.slice() : [];

      // sort ascending years for charts
      stats.sort((a, b) => Number(a.year) - Number(b.year));

      // determine range to fill: prefer user-specified start/end, else derive from returned data or defaults
      const s = startYear !== "" && startYear !== null ? Number(startYear) : (stats.length ? Number(stats[0].year) : 2000);
      const e = endYear !== "" && endYear !== null ? Number(endYear) : (stats.length ? Number(stats[stats.length - 1].year) : 2025);

      // ensure all years between s..e are present (no skipping)
      const filled = fillYearsWithZeros(stats, s, e);

      setData(filled);
      setFiltersApplied(json.filters_applied || {
        categories:
          (startYear || endYear ? 1 : 0) +
          (selectedPubTypes.length ? 1 : 0) +
          (selectedAffiliations.length ? 1 : 0),
        publication_types: selectedPubTypes,
        affiliations: selectedAffiliations,
        year_filter_applied: Boolean(startYear || endYear),
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch statistics");
      setData([]); // clear old data on failure
      setFiltersApplied(null);
    } finally {
      setLoading(false);
    }
  };

  // build ticks and chart width so every year is shown
  const ticks = data.map((d) => d.year);
  const EXTRA_RIGHT_PADDING = 80; // extra breathing room so last tick/label doesn't get clipped
  const chartWidth = Math.max(data.length * 60, 900) + EXTRA_RIGHT_PADDING; // ~60px per year, min 900, + padding

  const filtersTitle = () => {
    if (!filtersApplied) return "Filters: none";
    const parts = [];
    if (filtersApplied.publication_types && filtersApplied.publication_types.length)
      parts.push(`Types: ${filtersApplied.publication_types.join(", ")}`);
    if (filtersApplied.affiliations && filtersApplied.affiliations.length)
      parts.push(`Affiliations: ${filtersApplied.affiliations.join(", ")}`);
    if (filtersApplied.year_filter_applied) {
      // compute shown year range from data
      const years = data.length ? `${data[0].year}–${data[data.length - 1].year}` : "";
      if (years) parts.push(`Years: ${years}`);
    }
    const joined = parts.length ? parts.join(" • ") : "No filters applied";
    return `Filters applied: ${joined} (categories: ${filtersApplied.categories})`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Yearly Statistics</h2>

      {/* controls: years + request/reset */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13 }}>Start Year</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : "")}
            min={1993}
            max={2025}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13 }}>End Year</label>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : "")}
            min={1993}
            max={2025}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
          />
        </div>

        <div>
          <button onClick={requestStats} disabled={loading} style={{ ...buttonStyle, marginRight: 8 }}>
            {loading ? "Requesting..." : "Request Stats"}
          </button>
          <button onClick={resetAll} style={{ ...buttonStyle, background: "#888" }}>
            Reset
          </button>
        </div>
      </div>

      {/* checkboxes for publication types & affiliations */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Publication Types</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PUB_TYPES.map((pt) => (
              <label key={pt} style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedPubTypes.includes(pt)}
                  onChange={() => toggle(selectedPubTypes, setSelectedPubTypes, pt)}
                />
                <span style={{ marginLeft: 6 }}>{pt}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Affiliations</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {AFFILIATIONS.map((af) => (
              <label key={af} style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedAffiliations.includes(af)}
                  onChange={() => toggle(selectedAffiliations, setSelectedAffiliations, af)}
                />
                <span style={{ marginLeft: 6 }}>{af}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* filters applied title */}
      <div
        style={{
          background: "#f3f6f8",
          padding: "10px 12px",
          borderRadius: 8,
          marginBottom: 14,
          color: "#222",
        }}
      >
        <div style={{ fontWeight: 600 }}>{filtersApplied ? filtersTitle() : "Filters: none"}</div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: "#b00020", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gap: 16 }}>
        {/* Publications Over Time */}
        <section style={cardStyle}>
          <h3 style={{ margin: "0 0 10px 0" }}>Publications Over Time</h3>

          {data.length === 0 ? (
            <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>No data — click <b>Request Stats</b>.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                <LineChart
                  width={chartWidth}
                  height={320}
                  data={data}
                  margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="publications" stroke="#2f6fb2" name="Publications" />
                </LineChart>
              </div>
            </div>
          )}
        </section>

        {/* Unique Contributors */}
        <section style={cardStyle}>
          <h3 style={{ margin: "0 0 10px 0" }}>Unique Contributors</h3>

          {data.length === 0 ? (
            <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>No data — click <b>Request Stats</b>.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                <BarChart
                  width={chartWidth}
                  height={320}
                  data={data}
                  margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unique_contributors" fill="#69a973" name="Unique Contributors" />
                </BarChart>
              </div>
            </div>
          )}
        </section>

        {/* Avg Authors */}
        <section style={cardStyle}>
          <h3 style={{ margin: "0 0 10px 0" }}>Avg. Authors per Publication</h3>

          {data.length === 0 ? (
            <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>No data — click <b>Request Stats</b>.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                <LineChart
                  width={chartWidth}
                  height={320}
                  data={data}
                  margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average_authors_per_publication"
                    stroke="#ff8a00"
                    name="Avg Authors"
                  />
                </LineChart>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */
const buttonStyle = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
};

const cardStyle = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const checkboxLabel = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #eee",
  background: "#fafafa",
  cursor: "pointer",
  fontSize: 14,
  color: "#222",
  userSelect: "none",
};
