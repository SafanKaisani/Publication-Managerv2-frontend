// FacultyStats.jsx
import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function FacultyStats() {
  const [faculty, setFaculty] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Configure backend + credentials
  const BASE_URL = "http://127.0.0.1:8000";
  const USERNAME = "admin";
  const PASSWORD = "supersecretpassword";

  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28", "#A28BFF", "#FF6B8A"];

  const handleGetStats = async () => {
    setError("");
    setStats(null);

    if (!faculty || faculty.trim() === "") {
      alert("Please enter faculty name.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/statistics/person`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
        },
        body: JSON.stringify({ faculty: faculty.trim() }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Server returned ${resp.status}`);
      }

      const json = await resp.json();

      // Ensure returned object shape matches expected response model
      // (faculty, total_publications, role_counts, status_counts, yearly_counts)
      setStats(json);
    } catch (err) {
      console.error(err);
      setError(
        err?.message?.includes("404") ? "No publications found for that faculty." : `Error: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearStats = () => {
    setStats(null);
    setError("");
    setFaculty("");
  };

  // Convert role/status/year maps into arrays suitable for recharts
  const roleData = stats && stats.role_counts
    ? Object.entries(stats.role_counts).map(([name, value]) => ({ name, value }))
    : [];

  const statusData = stats && stats.status_counts
    ? Object.entries(stats.status_counts).map(([name, value]) => ({ name, value }))
    : [];

  // Sort yearly data ascending by year for the line chart
  const yearlyData = stats && stats.yearly_counts
    ? Object.entries(stats.yearly_counts)
        .map(([year, value]) => ({ year: String(year), count: value }))
        .sort((a, b) => Number(a.year) - Number(b.year))
    : [];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Faculty Stats</h2>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: 8 }}>
        <input
          type="text"
          placeholder="Faculty Name (e.g., Sajid Ali)"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleGetStats} style={buttonStyle} disabled={loading}>
          {loading ? "Loading..." : "Get Stats"}
        </button>
        <button onClick={clearStats} style={{ ...buttonStyle, background: "#888", marginLeft: 6 }}>
          Clear
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 14, color: "#b00020", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ marginTop: 30 }}>
          {/* Header / summary */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0 }}>{stats.faculty}</h3>
              <p style={{ margin: "6px 0 0 0", fontSize: 18 }}>
                Total Publications: <b>{stats.total_publications}</b>
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Role Pie */}
            <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h4 style={{ marginTop: 0 }}>Role Distribution</h4>
              {roleData.length === 0 ? (
                <p style={{ color: "#666" }}>No role data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {roleData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Pie */}
            <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h4 style={{ marginTop: 0 }}>Status Distribution</h4>
              {statusData.length === 0 ? (
                <p style={{ color: "#666" }}>No status data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Yearly Line chart (span two columns on small screens) */}
            <div style={{ gridColumn: "1 / -1", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h4 style={{ marginTop: 0 }}>Publications Over Time</h4>
              {yearlyData.length === 0 ? (
                <p style={{ color: "#666" }}>No yearly data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={yearlyData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" interval={0} angle={-60} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "320px",
  padding: "10px",
  margin: "0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

const buttonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "6px",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
  marginTop: 0,
  fontSize: "14px",
};

export default FacultyStats;
