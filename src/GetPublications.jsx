// GetPublications.jsx
import React, { useState } from "react";

const BASE_URL = "http://127.0.0.1:8000"; // backend URL

function GetPublications() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoad = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/get-publications`);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      // backend returns { data: [...] }
      const pubs = Array.isArray(json.data) ? json.data : json;
      setPublications(pubs);
    } catch (err) {
      console.error("Failed to load publications:", err);
      setError(err.message || "Failed to load publications");
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    "id",
    "Entry Date",
    "Faculty",
    "Publication Type",
    "Year",
    "Title",
    "Role",
    "Affiliation",
    "Status",
    "Reference",
    "Theme",
  ];

  const truncate = (v, n = 120) => {
    if (v === null || v === undefined) return "-";
    const s = String(v);
    return s.length > n ? s.slice(0, n) + "… " : s;
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>📚 Publications List</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleLoad}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              background: loading ? "#9fd9bd" : "#47af83",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Loading..." : "Load Publications"}
          </button>

          <div style={{ color: "#666", fontSize: 14 }}>
            {publications.length > 0 && !loading ? `${publications.length} results` : ""}
          </div>
        </div>
      </div>

      <div
        style={{
          minHeight: "400px",
          width: "100%",
          border: "2px solid #ccc",
          borderRadius: "10px",
          padding: "12px",
          backgroundColor: "#f9f9f9",
          marginTop: 16,
          boxSizing: "border-box",
        }}
      >
        {error && (
          <div
            role="alert"
            style={{
              background: "#fff0f0",
              color: "#a00",
              padding: "10px 12px",
              borderRadius: 6,
              marginBottom: 12,
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {!loading && publications.length === 0 && !error && (
          <p style={{ color: "#666", margin: 0 }}>Publications will appear here after you click "Load Publications".</p>
        )}

        {/* Table */}
        {publications.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        borderBottom: "2px solid #e6e6e6",
                        background: "#fafafa",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {publications.map((p) => (
                  <tr key={p.id ?? Math.random()} style={{ borderBottom: "1px solid #eee" }}>
                    {columns.map((col) => (
                      <td key={col} style={{ padding: "10px", verticalAlign: "top", fontSize: 13, color: "#222" }}>
                        {/* Map object key names exactly as backend returns */}
                        {col === "id" ? (p.id ?? "-") : truncate(p[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GetPublications;
