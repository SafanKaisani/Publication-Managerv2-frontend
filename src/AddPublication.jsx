// AddPublication.jsx
import React, { useState } from "react";

function AddPublication() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      alert(`Uploaded: ${file.name}`);
      // Later: send to backend with FormData
    } else {
      alert("Please select a CSV file before submitting.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Publication</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
        }}
      >
        {/* File input restricted to CSV */}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <button
          type="submit"
          style={{
            background: "#47af83",
            color: "#fff",
            padding: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload CSV
        </button>
      </form>

      {/* Show selected file */}
      {file && (
        <p style={{ marginTop: "10px", color: "#333" }}>
          Selected file: <strong>{file.name}</strong>
        </p>
      )}
    </div>
  );
}

export default AddPublication;
