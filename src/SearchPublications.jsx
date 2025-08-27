// SearchPublications.jsx
import React from "react";

function SearchPublications() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Search Publications</h2>
      <input
        type="text"
        placeholder="Search publications..."
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #ccc"
        }}
      />

      {/* Empty area for now */}
      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "12px",
          height: "400px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#888",
          fontSize: "18px",
        }}
      >
        Search Results will appear here
      </div>
    </div>
  );
}

export default SearchPublications;
