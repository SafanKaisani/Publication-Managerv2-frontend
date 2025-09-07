// ExportPublication.jsx
import React, { useState } from "react";

const BASE_URL = "http://127.0.0.1:8000";

export default function ExportPublication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const cleanupBlob = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setFileName(null);
  };

  const handleExport = async () => {
    setError(null);
    setLoading(true);

    if (fileUrl) {
      cleanupBlob();
    }

    try {
      const res = await fetch(`${BASE_URL}/export-latest`);
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();

      // Use exact filename from backend, if available
      const cd = res.headers.get("content-disposition") || "";
      let match = cd.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i);
      let extractedName = null;
      if (match) {
        extractedName = decodeURIComponent(match[1] || match[2] || match[3] || "").replace(/(^"|"$)/g, "");
      }
      const finalName = extractedName || "publications_export.csv"; // fallback only if backend sends nothing

      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      setFileName(finalName);

      // trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (err) {
      console.error("Export failed:", err);
      setError(err.message || "Export failed");
      if (fileUrl) {
        cleanupBlob();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAgain = () => {
    if (!fileUrl || !fileName) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export Publications</h2>
      <p style={{ color: "#555" }}>
        Request an export of all publications. The server will return a file for download.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            background: loading ? "#9fd9bd" : "#1976d2",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          {loading ? "Requesting export..." : "Request Export"}
        </button>

        {fileName && (
          <button
            onClick={handleDownloadAgain}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: "6px",
              background: "#47af83",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ⬇️ Download again ({fileName})
          </button>
        )}

        {fileName && (
          <button
            onClick={cleanupBlob}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              background: "#fff",
              color: "#333",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            background: "#fff0f0",
            color: "#a00",
            padding: "10px 12px",
            borderRadius: 6,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
