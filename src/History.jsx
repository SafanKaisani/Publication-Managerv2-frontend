// History.jsx
import React, { useState } from "react";

const BASE_URL = "http://127.0.0.1:8000"; // backend

export default function History() {
  const [pubId, setPubId] = useState("");
  const [historyEntries, setHistoryEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // hist_id currently expanded

  const handleViewHistory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setHistoryEntries(null);
    setError(null);

    const id = String(pubId || "").trim();
    if (!id) {
      setError("⚠️ Please enter a Publication ID first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(id)}`);
      if (!res.ok) {
        // try to show backend detail message
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || JSON.stringify(j);
        } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      // Expected shape: { history: [ ... ] }
      const entries = Array.isArray(json.history) ? json.history : [];
      setHistoryEntries(entries);
      if (entries.length === 0) {
        setError("No history found for this publication.");
      }
    } catch (err) {
      console.error("Fetch history failed:", err);
      setError(err.message || "Failed to fetch history");
      setHistoryEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (histId) => {
    setExpanded((cur) => (cur === histId ? null : histId));
  };

  const renderPreviousData = (prev) => {
    if (!prev) return <div style={{ color: "#666" }}>No previous data</div>;
    // previous_data may already be an object, or a JSON string
    let parsed = prev;
    if (typeof prev === "string") {
      try {
        parsed = JSON.parse(prev);
      } catch {
        parsed = prev; // keep as string
      }
    }
    if (typeof parsed === "string") {
      return <pre style={preStyle}>{parsed}</pre>;
    }
    try {
      return <pre style={preStyle}>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <pre style={preStyle}>{String(parsed)}</pre>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: 6 }}>Publication History</h2>
      <p style={{ color: "#eee", marginTop: 0 }}>
        Enter a Publication ID to view its change history (insert/update/delete).
      </p>

      <form onSubmit={handleViewHistory} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={pubId}
          onChange={(e) => {
            setPubId(e.target.value);
            setHistoryEntries(null);
            setError(null);
          }}
          placeholder="Publication ID (e.g., 123)"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 14,
            fontStyle: "italic",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            background: loading ? "#9fd9bd" : "#47af83",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Loading..." : "View History"}
        </button>
      </form>

      <div style={historyBoxStyle}>
        {error && (
          <div role="alert" style={alertStyle}>
            {error}
          </div>
        )}

        {!loading && !error && historyEntries === null && (
          <div style={{ color: "#888", textAlign: "center", paddingTop: 40 }}>
            History will appear here after you click "View History".
          </div>
        )}

        {historyEntries && historyEntries.length === 0 && !error && (
          <div style={{ color: "#666", textAlign: "center", paddingTop: 24 }}>
            No history records found for publication id {pubId}.
          </div>
        )}

        {historyEntries && historyEntries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {historyEntries.map((h) => {
              const id = h.hist_id ?? h.histId ?? `${h.pub_id}-${h.changed_at}`;
              const action = h.action ?? "change";
              const changedAt = h.changed_at ?? h.changedAt ?? h.changedAt;
              return (
                <div
                  key={id}
                  style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: 8,
                    padding: 12,
                    background: "#fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#222" }}>{action.toUpperCase()}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>{changedAt ?? "Unknown time"}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ color: "#666", fontSize: 13 }}>hist_id: {id}</div>
                      <button
                        onClick={() => toggleExpand(id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #ddd",
                          background: expanded === id ? "#f0f7ff" : "#fff",
                          cursor: "pointer",
                        }}
                        aria-expanded={expanded === id}
                      >
                        {expanded === id ? "Hide details" : "View previous"}
                      </button>
                    </div>
                  </div>

                  {expanded === id && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 8, fontSize: 13, color: "#444", fontWeight: 600 }}>
                        Previous data snapshot
                      </div>
                      {renderPreviousData(h.previous_data)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div style={{ color: "#666", textAlign: "center", paddingTop: 40 }}>
            Loading history...
          </div>
        )}
      </div>
    </div>
  );
}

const historyBoxStyle = {
  marginTop: 20,
  minHeight: 200,
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 15,
  background: "#f9f9f9",
  boxSizing: "border-box",
};

/* clearer alert */
const alertStyle = {
  background: "#fff0f0",
  color: "#a00",
  padding: "10px 12px",
  borderRadius: 6,
  fontWeight: 600,
  display: "inline-block",
};

/* IMPORTANT: readable JSON block style */
const preStyle = {
  background: "#ffffff",          // clear white panel
  color: "#222222",               // dark, readable text
  padding: 14,
  borderRadius: 8,
  border: "1px solid #e6eef3",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)",
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
  fontSize: 13,
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",         // allow wrapping
  wordBreak: "break-word",
  overflowX: "auto",
  maxHeight: 360,
  margin: 0,
};

