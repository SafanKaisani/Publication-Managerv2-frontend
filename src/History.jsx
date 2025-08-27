// History.jsx
import React, { useState } from "react";

function History() {
  const [pubId, setPubId] = useState("");
  const [history, setHistory] = useState(null);

  const handleSearch = () => {
    if (!pubId) {
      setHistory("⚠️ Please enter a Publication ID first.");
      return;
    }

    // Placeholder response
    setHistory(`📜 Showing history for Publication ID: ${pubId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Publication History</h2>
      <p style={{ color: "#555" }}>Enter a Publication ID to view its history.</p>

      <input
        type="text"
        value={pubId}
        onChange={(e) => setPubId(e.target.value)}
        placeholder="Publication ID (e.g., 123)"
        style={inputStyle}
      />

      <button
        onClick={handleSearch}
        style={buttonStyle}
      >
        View History
      </button>

      <div style={historyBoxStyle}>
        {history ? <p>{history}</p> : <p style={{ color: "#aaa" }}>History will appear here...</p>}
      </div>
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
};

const historyBoxStyle = {
  marginTop: "20px",
  minHeight: "200px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "15px",
  background: "#f9f9f9",
};

export default History;
