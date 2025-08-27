// ExportPDF.jsx
import React, { useState } from "react";

function ExportPDF() {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [fileReady, setFileReady] = useState(false);

  const handleExport = () => {
    // Placeholder: later this will call your backend PDF export API
    if (name && startYear && endYear) {
      setFileReady(true);
    } else {
      alert("Please enter Name, Start Year, and End Year.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export PDF Report</h2>
      <p style={{ color: "#555" }}>
        Enter the person's name and a year range (1993–2025). Then request a PDF
        of their work during that period.
      </p>

      {/* Name input */}
      <input
        type="text"
        placeholder="Name (e.g., Sajid Ali)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      {/* Start Year input */}
      <input
        type="number"
        placeholder="Start Year (e.g., 2000)"
        value={startYear}
        onChange={(e) => setStartYear(e.target.value)}
        min={1993}
        max={2025}
        style={inputStyle}
      />

      {/* End Year input */}
      <input
        type="number"
        placeholder="End Year (e.g., 2025)"
        value={endYear}
        onChange={(e) => setEndYear(e.target.value)}
        min={1993}
        max={2025}
        style={inputStyle}
      />

      {/* Request / Download buttons */}
      {!fileReady ? (
        <button onClick={handleExport} style={buttonStyle}>
          Request PDF
        </button>
      ) : (
        <a
          href="#"
          download={`${name}_publications.pdf`}
          style={{ ...buttonStyle, background: "green", textDecoration: "none" }}
        >
          ⬇️ Download PDF
        </a>
      )}
    </div>
  );
}

// Input styling
const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

// Button styling
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

export default ExportPDF;
