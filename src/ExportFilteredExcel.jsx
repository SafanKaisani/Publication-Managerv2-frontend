// ExportFilteredExcel.jsx
import React, { useState } from "react";

function ExportFilteredExcel() {
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [fileReady, setFileReady] = useState(false);

  const handleExport = () => {
    if (!faculty) {
      alert("Please enter Faculty name.");
      return;
    }

    if (year && (startYear || endYear)) {
      alert("Please either enter a single Year OR a Start + End Year, not both.");
      return;
    }

    if (!year && (!startYear || !endYear)) {
      alert("Please enter either a Year OR both Start Year and End Year.");
      return;
    }

    // ✅ Later connect to backend API
    setFileReady(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export Filtered Excel</h2>
      <p style={{ color: "#555" }}>
        Enter faculty name, then choose either a single year OR a range of years (1993–2025).
      </p>

      {/* Faculty */}
      <input
        type="text"
        placeholder="Faculty (e.g., Sajid Ali)"
        value={faculty}
        onChange={(e) => setFaculty(e.target.value)}
        style={inputStyle}
      />

      {/* Year (single) */}
      <input
        type="number"
        placeholder="Year (e.g., 2020)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        min={1993}
        max={2025}
        style={inputStyle}
      />

      <div style={{ textAlign: "center", margin: "10px 0" }}>— OR —</div>

      {/* Start Year */}
      <input
        type="number"
        placeholder="Start Year (e.g., 2015)"
        value={startYear}
        onChange={(e) => setStartYear(e.target.value)}
        min={1993}
        max={2025}
        style={inputStyle}
      />

      {/* End Year */}
      <input
        type="number"
        placeholder="End Year (e.g., 2025)"
        value={endYear}
        onChange={(e) => setEndYear(e.target.value)}
        min={1993}
        max={2025}
        style={inputStyle}
      />

      {/* Buttons */}
      {!fileReady ? (
        <button onClick={handleExport} style={buttonStyle}>
          Request Excel
        </button>
      ) : (
        <a
          href="#"
          download={`${faculty}_filtered_publications.xlsx`}
          style={{ ...buttonStyle, background: "green", textDecoration: "none" }}
        >
          ⬇️ Download Excel
        </a>
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
  marginTop: "15px",
  fontSize: "14px",
};

export default ExportFilteredExcel;
