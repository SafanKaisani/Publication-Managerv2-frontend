// ExportPublication.jsx
import React, { useState } from "react";

function ExportPublication() {
  const [fileReady, setFileReady] = useState(false);

  const handleExport = () => {
    // Safe placeholder — does not call backend, just simulates file ready
    setFileReady(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export Publications</h2>
      <p style={{ color: "#555" }}>
        Request an export of all publications. Once ready, you can download the Excel file.
      </p>

      {!fileReady ? (
        <button
          onClick={handleExport}
          style={buttonStyle}
        >
          Request Export
        </button>
      ) : (
        <div style={{ marginTop: "15px" }}>
          <a
            href="#"
            download="publications.xlsx"
            style={{ ...buttonStyle, background: "green", textDecoration: "none", display: "inline-block" }}
          >
            ⬇️ Download Excel File
          </a>
        </div>
      )}
    </div>
  );
}

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

export default ExportPublication;
