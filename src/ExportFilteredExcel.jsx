// ExportFilteredExcel.jsx
import React, { useState } from "react";

const BASE_URL = "http://127.0.0.1:8000"; // backend
const USERNAME = "admin"; // change if needed
const PASSWORD = "supersecretpassword"; // change if needed

const pubTypeOptions = ["Book Chapter", "Article", "Book"];
const affiliationOptions = ["IED", "Alumni/Student", "External", "PDCN", "PDCC"];

export default function ExportFilteredExcel() {
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [affiliations, setAffiliations] = useState([]);
  const [pubTypes, setPubTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(null);

  // toggle checkbox helper
  const toggle = (value, state, setState) => {
    if (state.includes(value)) setState(state.filter((x) => x !== value));
    else setState([...state, value]);
  };

  const cleanupBlob = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
      setFileName(null);
    }
  };

  const handleRequestExport = async () => {
    setError(null);

    // Validation: cannot have both year and start/end
    const hasYear = String(year).trim() !== "";
    const hasRange = String(startYear).trim() !== "" || String(endYear).trim() !== "";

    if (hasYear && (String(startYear).trim() !== "" || String(endYear).trim() !== "")) {
      setError("Please provide either a single Year OR a Start + End Year, not both.");
      return;
    }

    // build payload: include only keys that user supplied
    const payload = {};
    // faculty: ignore empty or whitespace-only
    if (String(faculty).trim() !== "") payload.faculty = faculty.trim();
    if (hasYear) {
      // backend expects integer (0 treated as not provided). we'll parse int here.
      const iv = parseInt(year, 10);
      if (!Number.isNaN(iv)) payload.year = iv;
    } else {
      // range fields: only include if user filled them
      if (String(startYear).trim() !== "") {
        const sv = parseInt(startYear, 10);
        if (!Number.isNaN(sv)) payload.start_year = sv;
      }
      if (String(endYear).trim() !== "") {
        const ev = parseInt(endYear, 10);
        if (!Number.isNaN(ev)) payload.end_year = ev;
      }
    }

    payload.publication_types = pubTypes.length ? pubTypes : ["string"];
    payload.affiliations = affiliations.length ? affiliations : ["string"];


    // Save filtersApplied for title display (frontend only)
    setFiltersApplied({
      faculty: payload.faculty || null,
      year: payload.year ?? null,
      start_year: payload.start_year ?? null,
      end_year: payload.end_year ?? null,
      publication_types: payload.publication_types ?? [],
      affiliations: payload.affiliations ?? [],
    });

    setLoading(true);

    // cleanup old blob if any
    cleanupBlob();

    try {
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);
      const res = await fetch(`${BASE_URL}/export-publications-excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basic,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to get JSON error detail
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || JSON.stringify(j);
        } catch (e) {}
        throw new Error(msg);
      }

      const blob = await res.blob();

      // extract filename from content-disposition (preserve exact backend name)
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i);
      const extracted = match ? decodeURIComponent(match[1] || match[2] || match[3] || "") : null;
      const finalName = extracted || `publications_filtered_${Date.now()}.xlsx`;

      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      setFileName(finalName);

      // automatic download
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export filtered excel failed:", err);
      setError(err.message || "Export failed");
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
    <div style={{ padding: 20 }}>
      <h2>Export Filtered Excel</h2>

      {/* Filters applied title */}
      {filtersApplied && (
        <div style={{ marginBottom: 12, color: "#333" }}>
          <strong>Filters requested:</strong>{" "}
          <span style={{ color: "#555", fontWeight: 600 }}>
            {filtersApplied.faculty ? `Faculty=${filtersApplied.faculty} · ` : ""}
            {filtersApplied.year ? `Year=${filtersApplied.year} · ` : ""}
            {filtersApplied.start_year || filtersApplied.end_year
              ? `Range=${filtersApplied.start_year ?? ""}-${filtersApplied.end_year ?? ""} · `
              : ""}
            {filtersApplied.publication_types && filtersApplied.publication_types.length
              ? `Types=[${filtersApplied.publication_types.join(", ")}] · `
              : ""}
            {filtersApplied.affiliations && filtersApplied.affiliations.length
              ? `Aff=[${filtersApplied.affiliations.join(", ")}]`
              : ""}
          </span>
        </div>
      )}

      <p style={{ color: "#555" }}>
        Enter faculty name (optional), then choose either a single year OR a range of years (1993–2025).
        Optionally filter by Affiliations and Publication Types.
      </p>

      <div style={{ maxWidth: 680 }}>
        {/* Faculty */}
        <input
          type="text"
          placeholder="Faculty (optional, e.g., Sajid Ali)"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          style={inputStyle}
        />

        {/* Year (single) */}
        <input
          type="number"
          placeholder="Year (e.g., 2020)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={1993}
          max={2025}
          style={inputStyle}
        />

        <div style={{ textAlign: "center", margin: "10px 0" }}>— OR —</div>

        {/* Start / End Year */}
        <input
          type="number"
          placeholder="Start Year (e.g., 2015)"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          min={1993}
          max={2025}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="End Year (e.g., 2025)"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          min={1993}
          max={2025}
          style={inputStyle}
        />

        {/* Publication Types */}
        <label style={{ fontWeight: "bold", marginTop: 10, display: "block" }}>Publication Types</label>
        <div style={checkboxGroupStyle}>
          {pubTypeOptions.map((t) => (
            <label key={t} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={pubTypes.includes(t)}
                onChange={() => toggle(t, pubTypes, setPubTypes)}
              />
              <span style={{ marginLeft: 6 }}>{t}</span>
            </label>
          ))}
        </div>

        {/* Affiliations */}
        <label style={{ fontWeight: "bold", marginTop: 10, display: "block" }}>Affiliations</label>
        <div style={checkboxGroupStyle}>
          {affiliationOptions.map((a) => (
            <label key={a} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={affiliations.includes(a)}
                onChange={() => toggle(a, affiliations, setAffiliations)}
              />
              <span style={{ marginLeft: 6 }}>{a}</span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
          <button
            onClick={handleRequestExport}
            disabled={loading}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: 6,
              background: loading ? "#9fd9bd" : "#1976d2",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              fontSize: 14,
            }}
          >
            {loading ? "Requesting..." : "Request Excel"}
          </button>

          {fileName && (
            <>
              <button
                onClick={handleDownloadAgain}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: 6,
                  background: "#47af83",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ⬇️ Download ({fileName})
              </button>

              <button
                onClick={() => {
                  cleanupBlob();
                  setFiltersApplied(null);
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, background: "#fff0f0", color: "#a00", padding: 10, borderRadius: 6 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// styles
const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

const checkboxGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  margin: "10px 0",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "14px",
};

export { pubTypeOptions, affiliationOptions };
