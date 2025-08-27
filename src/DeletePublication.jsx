// DeletePublication.jsx
import React, { useState } from "react";

function DeletePublication() {
  const [pubId, setPubId] = useState("");
  const [message, setMessage] = useState("");

  const handleDelete = () => {
    if (!pubId) {
      setMessage("⚠️ Please enter a Publication ID first.");
      return;
    }

    // Placeholder confirmation logic
    // Later this will be replaced with actual backend call
    setMessage(`✅ Publication with ID ${pubId} deleted successfully.`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Delete Publication</h2>
      <p style={{ color: "#555" }}>Enter the Publication ID you want to delete.</p>

      <input
        type="text"
        value={pubId}
        onChange={(e) => setPubId(e.target.value)}
        placeholder="Publication ID (e.g., 123)"
        style={inputStyle}
      />

      <button
        onClick={handleDelete}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          background: "#c62828",
          color: "#fff",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Delete
      </button>

      {message && (
        <p style={{ marginTop: "15px", fontWeight: "bold", color: "#333" }}>
          {message}
        </p>
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

export default DeletePublication;
