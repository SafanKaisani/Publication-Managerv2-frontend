// FacultyStats.jsx
import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

function FacultyStats() {
  const [faculty, setFaculty] = useState("");
  const [stats, setStats] = useState(null);

  const handleGetStats = () => {
    if (!faculty) {
      alert("Please enter faculty name.");
      return;
    }

    // ✅ Replace with real API later
    const exampleStats = {
      faculty: "Sajid Ali",
      total_publications: 28,
      role_counts: { "Main Author": 21, "Secondary Author": 7 },
      status_counts: { Published: 26, "Submitted for publication": 1, Accepted: 1 },
      yearly_counts: {
        2005: 1, 2006: 2, 2007: 2, 2008: 1, 2009: 2, 2010: 2, 2011: 2,
        2012: 1, 2013: 2, 2014: 1, 2015: 1, 2016: 1, 2017: 1,
        2020: 1, 2021: 2, 2022: 3, 2023: 1, 2024: 1, 2025: 1,
      }
    };

    setStats(exampleStats);
  };

  // Transform role_counts and status_counts into arrays
  const roleData = stats ? Object.entries(stats.role_counts).map(([key, value]) => ({ name: key, value })) : [];
  const statusData = stats ? Object.entries(stats.status_counts).map(([key, value]) => ({ name: key, value })) : [];
  const yearlyData = stats ? Object.entries(stats.yearly_counts).map(([year, value]) => ({ year, count: value })) : [];

  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Faculty Stats</h2>
      <input
        type="text"
        placeholder="Faculty Name (e.g., Sajid Ali)"
        value={faculty}
        onChange={(e) => setFaculty(e.target.value)}
        style={inputStyle}
      />
      <button onClick={handleGetStats} style={buttonStyle}>Get Stats</button>

      {stats && (
        <div style={{ marginTop: "30px" }}>
          {/* Summary */}
          <h3>{stats.faculty}</h3>
          <p style={{ fontSize: "18px" }}>
            Total Publications: <b>{stats.total_publications}</b>
          </p>

          {/* Role Pie Chart */}
          <h4>Role Distribution</h4>
          <PieChart width={400} height={250}>
            <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {roleData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          {/* Status Pie Chart */}
          <h4>Status Distribution</h4>
          <PieChart width={400} height={250}>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {statusData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          {/* Yearly Line Chart */}
          <h4>Publications Over Time</h4>
          <LineChart width={600} height={300} data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
             dataKey="year"
            textAnchor="end" 
            interval={0}
            angle={-60}
            height={70}>    
            </XAxis>
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

const buttonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "6px",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
  marginTop: "10px",
  fontSize: "14px",
};

export default FacultyStats;
