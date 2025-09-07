// AddPublication.jsx
import React, { useState } from "react";

function AddPublication() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null); // short success text
  const [errorMsg, setErrorMsg] = useState(null);

  // <<-- CONFIG: set these for dev; consider using env vars (import.meta.env) instead -->> 
  const BASE_URL = "http://127.0.0.1:8000"; // your backend
  const USERNAME = "admin";
  const PASSWORD = "supersecretpassword";
  // <<-- end config -->> 

  const handleFileChange = (e) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    const f = e.target.files[0];
    setFile(f);
  };

  const validateCsv = (f) => {
    if (!f) return false;
    const name = f.name || "";
    return name.toLowerCase().endsWith(".csv");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!file) {
      setErrorMsg("Please select a CSV file before submitting.");
      return;
    }
    if (!validateCsv(file)) {
      setErrorMsg("Selected file must have a .csv extension.");
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file, file.name);

      const url = `${BASE_URL}/upload-publications`;
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: basic,
        },
        body: form,
      });

      if (!resp.ok) {
        let msg = `${resp.status} ${resp.statusText}`;
        try {
          const j = await resp.json();
          msg = j.detail || j.message || JSON.stringify(j);
        } catch {
          try {
            msg = await resp.text();
          } catch {}
        }
        throw new Error(msg);
      }

      // success: backend returns JSON summary - we show a short Uploaded message
      const json = await resp.json().catch(() => null);
      // If backend provides counts, show them briefly
      if (json && (json.added_count || json.updated_count)) {
        const parts = [];
        if (json.added_count) parts.push(`added ${json.added_count}`);
        if (json.updated_count) parts.push(`updated ${json.updated_count}`);
        setSuccessMsg(`Uploaded (${parts.join(", ")})`);
      } else {
        setSuccessMsg("Uploaded");
      }

      // clear selected file
      setFile(null);
      // optionally reset file input visually: we'll reset the input via a trick: find file input and clear it
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((fi) => (fi.value = ""));

    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 760 }}>
      <h2>Add Publication (Upload CSV)</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={uploading}
            style={{
              background: uploading ? "#9fd9bd" : "#47af83",
              color: "#fff",
              padding: "10px 16px",
              border: "none",
              borderRadius: 6,
              cursor: uploading ? "default" : "pointer",
              fontWeight: 600,
            }}
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>

          {/* small area showing current selected file name (if any) */}
          <div style={{ color: "#333", fontSize: 14 }}>
            {file ? <span>Selected: <strong>{file.name}</strong></span> : <span>No file selected</span>}
          </div>
        </div>
      </form>

      {/* Compact success / error messages */}
      {successMsg && (
        <div
          role="status"
          style={{
            marginTop: 12,
            background: "#ecf9f0",
            color: "#1b6e3a",
            padding: "10px 12px",
            borderRadius: 6,
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            background: "#fff0f0",
            color: "#a00",
            padding: "10px 12px",
            borderRadius: 6,
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default AddPublication;
