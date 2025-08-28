// CreatePublication.jsx
import React from "react";

function CreatePublication() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Create New Publication</h2>
      <p style={{ color: "#555" }}>
        Enter details for a new publication entry below.
      </p>

      {/* Entry Date */}
      <input
        type="text"
        placeholder="Entry Date (e.g., 2025-06-30 00:00:00)"
        style={inputStyle}
      />

      {/* Faculty */}
      <input
        type="text"
        placeholder="Faculty (e.g., Sajid Ali)"
        style={inputStyle}
      />

      {/* Publication Type */}
      <input
        type="text"
        placeholder="Publication Type (e.g., Book Chapter)"
        style={inputStyle}
      />

      {/* Year */}
      <input
        type="number"
        placeholder="Year (e.g., 2025)"
        style={inputStyle}
      />

      {/* Title */}
      <input
        type="text"
        placeholder="Title (e.g., Generating and Implementing Research-Informed Policies...)"
        style={inputStyle}
      />

      {/* Role */}
      <input
        type="text"
        placeholder="Role (e.g., Main Author)"
        style={inputStyle}
      />

      {/* Affiliation */}
      <input
        type="text"
        placeholder="Affiliation (e.g., IED)"
        style={inputStyle}
      />

      {/* Status */}
      <input
        type="text"
        placeholder="Status (e.g., Published)"
        style={inputStyle}
      />

      {/* Reference */}
      <textarea
        placeholder="Reference (e.g., Ali, S., Ahmed, A., & Ahmad, S. (2025). Generating and implementing...)"
        style={{ ...inputStyle, height: "100px" }}
      />

      {/* Theme */}
      <input
        type="text"
        placeholder="Theme (e.g., Educational Leadership and Policy)"
        style={inputStyle}
      />

      {/* Submit button */}
      <button
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          background: "#1976d2",
          color: "#fff",
          cursor: "pointer",
          marginTop: "15px",
        }}
      >
        Create Publication
      </button>
    </div>
  );
}

// Reusable style for inputs
const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

export default CreatePublication;
