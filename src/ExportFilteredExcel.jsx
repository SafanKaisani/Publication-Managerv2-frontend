// ExportFilteredExcel.jsx
// NOTE: install dependency first: npm install xlsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

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

  // NEW: unique-only export toggle
  const [uniqueOnly, setUniqueOnly] = useState(false);

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

  // helper: fetch raw publications (client-side XLSX path)
  const fetchAllPublications = async () => {
    const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);
    const res = await fetch(`${BASE_URL}/get-publications`, {
      method: "GET",
      headers: { Authorization: basic },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : (json.data || []);
  };

  // helper: normalize string
  const norm = (s) => (s === null || s === undefined ? "" : String(s).trim().toLowerCase());

  // dedupe rows by (year + normalized title)
  const dedupeRowsByYearTitle = (rows) => {
    const seen = new Map();
    for (const r of rows) {
      const rawYear = r.Year ?? r.year ?? "";
      const y = String(rawYear).trim();
      const title = (r.Title ?? r.title ?? "").trim();
      if (!title) continue;
      const key = `${y}::${norm(title)}`;
      if (!seen.has(key)) seen.set(key, r);
    }
    return Array.from(seen.values());
  };

  // Build consistent Excel object
  const rowToExcelObject = (r) => ({
    id: r.id ?? r.ID ?? "",
    "Entry Date": r["Entry Date"] ?? r.entryDate ?? "",
    Faculty: r.Faculty ?? r.faculty ?? "",
    "Publication Type": r["Publication Type"] ?? r.publicationType ?? "",
    Year: r.Year ?? r.year ?? "",
    Title: r.Title ?? r.title ?? "",
    Role: r.Role ?? r.role ?? "",
    Affiliation: r.Affiliation ?? r.affiliation ?? "",
    Status: r.Status ?? r.status ?? "",
    Reference: r.Reference ?? r.reference ?? "",
    Theme: r.Theme ?? r.theme ?? "",
  });

  // Client-side export path: fetch raw, apply filters, dedupe if requested, build XLSX using SheetJS (XLSX static import)
  const clientSideExport = async (payload) => {
    const all = await fetchAllPublications();

    // apply filters on client
    let filtered = all.filter((r) => {
      if (payload.faculty) {
        if (norm(r.Faculty ?? r.faculty ?? "") !== norm(payload.faculty)) return false;
      }
      if (payload.year !== undefined && payload.year !== null) {
        const ry = String(r.Year ?? r.year ?? "").trim();
        if (String(payload.year) !== ry) return false;
      } else {
        if (payload.start_year !== undefined && payload.start_year !== null) {
          const ry = Number(r.Year ?? r.year ?? "");
          if (Number.isNaN(ry) || ry < Number(payload.start_year)) return false;
        }
        if (payload.end_year !== undefined && payload.end_year !== null) {
          const ry = Number(r.Year ?? r.year ?? "");
          if (Number.isNaN(ry) || ry > Number(payload.end_year)) return false;
        }
      }
      if (payload.publication_types && Array.isArray(payload.publication_types) && payload.publication_types.length && !(payload.publication_types.length === 1 && payload.publication_types[0] === "string")) {
        const p = norm(r["Publication Type"] ?? r.publicationType ?? "");
        const lowers = payload.publication_types.map((x) => String(x).toLowerCase());
        if (!lowers.includes(p)) return false;
      }
      if (payload.affiliations && Array.isArray(payload.affiliations) && payload.affiliations.length && !(payload.affiliations.length === 1 && payload.affiliations[0] === "string")) {
        const a = norm(r.Affiliation ?? r.affiliation ?? "");
        const lowers = payload.affiliations.map((x) => String(x).toLowerCase());
        if (!lowers.includes(a)) return false;
      }
      return true;
    });

    if (payload.unique_only) filtered = dedupeRowsByYearTitle(filtered);

    const excelRows = filtered.map(rowToExcelObject);

    // Build workbook using statically-imported XLSX
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Publications");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const fname = `publications_filtered_${payload.unique_only ? "unique_" : ""}${new Date().toISOString().replace(/[:.-]/g, "")}.xlsx`;
    const url = URL.createObjectURL(blob);
    setFileUrl(url);
    setFileName(fname);

    // auto-download
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
    if (String(faculty).trim() !== "") payload.faculty = faculty.trim();
    if (hasYear) {
      const iv = parseInt(year, 10);
      if (!Number.isNaN(iv)) payload.year = iv;
    } else {
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
    payload.unique_only = !!uniqueOnly;

    setFiltersApplied({
      faculty: payload.faculty || null,
      year: payload.year ?? null,
      start_year: payload.start_year ?? null,
      end_year: payload.end_year ?? null,
      publication_types: payload.publication_types ?? [],
      affiliations: payload.affiliations ?? [],
      unique_only: payload.unique_only,
    });

    setLoading(true);
    cleanupBlob();

    try {
      if (uniqueOnly) {
        await clientSideExport(payload);
        setLoading(false);
        return;
      }

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
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || JSON.stringify(j);
        } catch (e) {}
        throw new Error(msg);
      }

      const blob = await res.blob();
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
              ? `Aff=[${filtersApplied.affiliations.join(", ")}] · `
              : ""}
            {filtersApplied.unique_only ? `UniqueOnly=${filtersApplied.unique_only}` : ""}
          </span>
        </div>
      )}

      <p style={{ color: "#555" }}>
        Enter faculty name (optional), then choose either a single year OR a range of years (1993–2025).
        Optionally filter by Affiliations and Publication Types.
      </p>

      <div style={{ maxWidth: 680 }}>
        <input
          type="text"
          placeholder="Faculty (optional, e.g., Sajid Ali)"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          style={inputStyle}
        />

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

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={uniqueOnly} onChange={(e) => setUniqueOnly(e.target.checked)} />
            <span style={{ fontSize: 14 }}>Export unique rows only (dedupe by Title per Year)</span>
          </label>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            When checked, the client will fetch publications and deduplicate by title+year, then generate the Excel file in-browser.
          </div>
        </div>

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
