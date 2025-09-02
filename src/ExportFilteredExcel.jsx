// ExportFilteredExcel.jsx
import React, { useState } from "react";

function ExportFilteredExcel() {
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [affiliations, setAffiliations] = useState([]);
  const [pubTypes, setPubTypes] = useState([]);
  const [fileReady, setFileReady] = useState(false);

  // ✅ Options (same as PDF export)
  const pubTypeOptions = ["Book Chapter", "Article", "Book"];
  const affiliationOptions = ["IED", "Alumni/Student", "External", "PDCN", "PDCC"];

  const handleExport = () => {
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

  const handleCheckboxChange = (value, state, setState) => {
    if (state.includes(value)) {
      setState(state.filter((item) => item !== value));
    } else {
      setState([...state, value]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export Filtered Excel</h2>
      <p style={{ color: "#555" }}>
        Enter faculty name (optional), then choose either a single year OR a range of years (1993–2025).
        Optionally filter by Affiliations and Publication Types.
      </p>

      {/* Faculty (optional) */}
      <input
        type="text"
        placeholder="Faculty (optional, e.g., Sajid Ali)"
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

      {/* Publication Types (checkboxes) */}
      <label style={{ fontWeight: "bold", marginTop: "10px", display: "block" }}>
        Publication Types
      </label>
      <div style={checkboxGroupStyle}>
        {pubTypeOptions.map((type) => (
          <label key={type} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={pubTypes.includes(type)}
              onChange={() => handleCheckboxChange(type, pubTypes, setPubTypes)}
            />
            {type}
          </label>
        ))}
      </div>

      {/* Affiliations (checkboxes) */}
      <label style={{ fontWeight: "bold", marginTop: "10px", display: "block" }}>
        Affiliations
      </label>
      <div style={checkboxGroupStyle}>
        {affiliationOptions.map((aff) => (
          <label key={aff} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={affiliations.includes(aff)}
              onChange={() => handleCheckboxChange(aff, affiliations, setAffiliations)}
            />
            {aff}
          </label>
        ))}
      </div>

      {/* Buttons */}
      {!fileReady ? (
        <button onClick={handleExport} style={buttonStyle}>
          Request Excel
        </button>
      ) : (
        <a
          href="#"
          download={`${faculty || "ALL"}_filtered_publications.xlsx`}
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

const checkboxGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  margin: "10px 0",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "14px",
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
