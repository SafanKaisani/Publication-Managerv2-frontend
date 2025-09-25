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

  // prominent button styles - extracted so it's easy to tweak
 const primaryBtn = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  background: loading
    ? "#90caf9" // lighter blue when loading
    : "linear-gradient(90deg,#1e88e5,#1565c0)", // main blue gradient
  color: "#fff",
  cursor: loading ? "default" : "pointer",
  fontWeight: 800,
  fontSize: 15,
  boxShadow: loading ? "none" : "0 6px 18px rgba(21,101,192,0.25)",
  transition: "transform .12s ease, box-shadow .12s ease, opacity .12s ease",
  transform: loading ? "none" : "translateY(0)",
};

  const primaryBtnHover = {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 28px rgba(37,150,86,0.22)",
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>📚 Publications List</h2>

        {/* big prominent button (near the heading) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 6 }}>
          <button
            onClick={handleLoad}
            disabled={loading}
            aria-label="Load publications (access key L)"
            accessKey="l"
            title="Load publications (Alt+L / Option+L)"
            style={primaryBtn}
            onMouseOver={(e) => {
              if (!loading) Object.assign(e.currentTarget.style, primaryBtnHover);
            }}
            onMouseOut={(e) => {
              if (!loading) Object.assign(e.currentTarget.style, primaryBtn);
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,111,178,0.12), 0 10px 28px rgba(37,150,86,0.22)";
            }}
            onBlur={(e) => {
              if (!loading) e.currentTarget.style.boxShadow = primaryBtn.boxShadow;
            }}
          >
            {loading ? "Loading publications…" : "Load Publications"}
          </button>

          {/* results count (announced to screen readers via aria-live) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div
              aria-live="polite"
              style={{ color: "#666", fontSize: 13, minHeight: 18, marginTop: 2 }}
            >
              {publications.length > 0 && !loading ? `${publications.length} results` : ""}
            </div>
            {/* small helper hint */}
            <div style={{ color: "#999", fontSize: 12 }}>Tip: shortcut Alt/Option + L</div>
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
          <p style={{ color: "#666", margin: 0 }}>
            Publications will appear here after you click{" "}
            <strong style={{ color: "#222" }}>Load Publications</strong>.
          </p>
        )}

        {/* Table */}
        {publications.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
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
