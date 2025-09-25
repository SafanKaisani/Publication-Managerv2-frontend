// SearchPublications.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";

function SearchPublications() {
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false); // search loading
  const [loadingResolve, setLoadingResolve] = useState(false); // resolving full pub
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const runSearch = async (term) => {
    const trimmed = (term || "").trim();
    if (!trimmed) {
      setMatches([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/search-publications?title=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setMatches(Array.isArray(json.matches) ? json.matches : []);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.message || "Search failed");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 450);
  };

  const onSearchClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    clearTimeout(debounceRef.current);
    runSearch(q);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      runSearch(q);
    }
  };

  // Try to resolve a full publication object before navigating
  const openForEdit = async (pub) => {
    // If pub already contains many fields (Title + Reference / Role etc.), assume it's full enough
    const looksFull = pub && (pub["Reference"] || pub.Reference || pub.Title) && (pub.Faculty || pub.faculty);
    if (looksFull) {
      navigate("/update-publication", { state: { publication: pub } });
      return;
    }

    // Otherwise try to fetch full set and find by id
    if (!pub?.id) {
      // no id — just navigate with what we have
      console.warn("Publication has no id; navigating with partial object.", pub);
      navigate("/update-publication", { state: { publication: pub } });
      return;
    }

    setLoadingResolve(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/get-publications`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      const pubs = Array.isArray(json.data) ? json.data : json;
      const target = pubs.find((p) => String(p.id) === String(pub.id));
      if (target) {
        navigate("/update-publication", { state: { publication: target } });
      } else {
        // not found: fallback to what we have but warn
        console.warn(`Full publication with id ${pub.id} not found; navigating with partial object.`, pub);
        navigate("/update-publication", { state: { publication: pub } });
      }
    } catch (err) {
      console.error("Failed to resolve full publication:", err);
      // fallback
      navigate("/update-publication", { state: { publication: pub } });
    } finally {
      setLoadingResolve(false);
    }
  };

  const columns = ["id", "Title", "Faculty", "Year", "Status"];
  const truncate = (v, n = 120) => {
    if (v === null || v === undefined) return "-";
    const s = String(v);
    return s.length > n ? s.slice(0, n) + "…" : s;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "12px" }}>Search Publications</h2>

      <form onSubmit={onSearchClick} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search publications by title..."
          value={q}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />

        <button
          onClick={onSearchClick}
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: loading ? "#9fd9bd" : "#1e88e5", // slightly bluer button
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "12px",
          minHeight: "400px",
          padding: 16,
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {error && (
          <div role="alert" style={{ background: "#fff0f0", color: "#a00", padding: "10px 12px", borderRadius: 6, marginBottom: 12, display: "inline-block", fontWeight: 600 }}>
            {error}
          </div>
        )}

        {!loading && matches.length === 0 && !error && (
          <div style={{ color: "#666", fontSize: 16, textAlign: "center", marginTop: 60 }}>
            No results — try a different keyword or click Search.
          </div>
        )}

        {matches.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 6 }}>
            <div style={{ marginBottom: 8, color: "#333", fontWeight: 600 }}>Showing {matches.length} result{matches.length > 1 ? "s" : ""}</div>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #e6e6e6", background: "#fafafa", fontWeight: 700, fontSize: 13 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr
                    key={m.id ?? Math.random()}
                    style={{ borderBottom: "1px solid #eee", cursor: loadingResolve ? "wait" : "pointer", opacity: loadingResolve ? 0.7 : 1 }}
                    onClick={() => openForEdit(m)}
                    title={loadingResolve ? "Resolving full publication..." : "Click to open in Update view"}
                  >
                    {columns.map((col) => (
                      <td key={col} style={{ padding: "10px", verticalAlign: "top", fontSize: 13, color: "#222" }}>
                        {col === "Title" ? (
                          <span style={{ textDecoration: "underline", color: "#0b6", fontWeight: 600 }}>{truncate(m[col])}</span>
                        ) : col === "id" ? (m.id ?? "-") : truncate(m[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div style={{ color: "#666", fontSize: 16, textAlign: "center", marginTop: 60 }}>Searching...</div>}
      </div>
    </div>
  );
}

export default SearchPublications;
