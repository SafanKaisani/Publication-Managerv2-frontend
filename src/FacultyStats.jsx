// FacultyStats.jsx (patched: robust PDF export, landscape, inline styles, numeric overlays)
import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const BASE_URL = "http://127.0.0.1:8000";
const USERNAME = "admin";
const PASSWORD = "supersecretpassword";

const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28", "#A28BFF", "#FF6B8A"];
const FETCH_TIMEOUT = 4000; // ms

// wait until SVGs exist and have measurable size
async function waitForChartsReady(container, { timeout = 4000, interval = 80 } = {}) {
  if (!container) return false;
  const start = Date.now();
  const check = () => {
    const svgs = container.querySelectorAll("svg");
    if (!svgs || svgs.length === 0) return false;
    return Array.from(svgs).every((s) => {
      try {
        const r = s.getBoundingClientRect();
        return r && r.width > 8 && r.height > 8;
      } catch {
        return false;
      }
    });
  };
  while (Date.now() - start < timeout) {
    if (check()) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

// copy computed styles from source DOM tree to target clone (best-effort)
function copyComputedStylesRecursive(sourceRoot, targetRoot) {
  try {
    const srcQueue = [sourceRoot];
    const tgtQueue = [targetRoot];
    while (srcQueue.length) {
      const src = srcQueue.shift();
      const tgt = tgtQueue.shift();
      if (!tgt) continue;
      try {
        const cs = window.getComputedStyle(src);
        let cssText = "";
        for (let i = 0; i < cs.length; i++) {
          const prop = cs[i];
          const val = cs.getPropertyValue(prop);
          cssText += `${prop}:${val};`;
        }
        tgt.style.cssText = cssText;
        if (src.tagName && src.tagName.toLowerCase() === "text") {
          const fill = cs.getPropertyValue("fill") || cs.getPropertyValue("color");
          if (fill) try { tgt.setAttribute("fill", fill); } catch (e) {}
        }
      } catch (e) {
        // ignore per-node errors
      }
      const srcChildren = Array.from(src.children || []);
      const tgtChildren = Array.from(tgt.children || []);
      for (let i = 0; i < srcChildren.length; i++) {
        srcQueue.push(srcChildren[i]);
        tgtQueue.push(tgtChildren[i] || srcChildren[i].cloneNode(false));
      }
    }
  } catch (err) {
    // ignore copy failures
    console.warn("copyComputedStylesRecursive:", err);
  }
}

export default function FacultyStats() {
  const [faculty, setFaculty] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // faculty list (datalist)
  const [faculties, setFaculties] = useState([]);
  const [facLoading, setFacLoading] = useState(false);
  const [facError, setFacError] = useState("");

  // export
  const printRef = useRef(null);
  const [exportTimestamp, setExportTimestamp] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // fetch faculty names deduped from publications endpoint
  const fetchFaculties = async () => {
    setFacError("");
    setFacLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/get-publications`, {
        headers: { Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`) },
      });
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const json = await resp.json();
      const pubs = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      const names = pubs
        .map((r) => (r && (r["Faculty"] || r.Faculty) ? String(r["Faculty"] || r.Faculty).trim() : ""))
        .filter((n) => n)
        .reduce((acc, cur) => {
          const key = cur.toLowerCase();
          if (!acc.map.has(key)) {
            acc.map.set(key, cur);
            acc.list.push(cur);
          }
          return acc;
        }, { map: new Map(), list: [] }).list;
      names.sort((a,b) => a.localeCompare(b));
      setFaculties(names);
    } catch (err) {
      console.error("fetchFaculties failed:", err);
      setFacError(err.message || "Failed to fetch faculties");
      setFaculties([]);
    } finally {
      setFacLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStats = async () => {
    setError("");
    setStats(null);
    if (!faculty || faculty.trim() === "") {
      alert("Please enter faculty name.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/statistics/person`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
        },
        body: JSON.stringify({ faculty: faculty.trim() }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Server returned ${resp.status}`);
      }
      const json = await resp.json();
      // ensure numeric coercion for yearly counts
      setStats({
        faculty: json.faculty,
        total_publications: json.total_publications,
        role_counts: json.role_counts || {},
        status_counts: json.status_counts || {},
        yearly_counts: json.yearly_counts || {},
      });
      // set export timestamp to null (will be set on export)
      setExportTimestamp("");
      // small delay to let Recharts render before possible immediate export
      await new Promise((r) => setTimeout(r, 40));
    } catch (err) {
      console.error("Get stats failed:", err);
      setError(err.message || "Error fetching stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const clearStats = () => {
    setStats(null);
    setError("");
    setFaculty("");
    setExportTimestamp("");
  };

  // Convert role/status/year maps into arrays
  const roleData = stats && stats.role_counts ? Object.entries(stats.role_counts).map(([name, value]) => ({ name, value: Number(value) })) : [];
  const statusData = stats && stats.status_counts ? Object.entries(stats.status_counts).map(([name, value]) => ({ name, value: Number(value) })) : [];
  const yearlyData = stats && stats.yearly_counts ? Object.entries(stats.yearly_counts).map(([year, value]) => ({ year: String(year), count: Number(value) })).sort((a,b) => Number(a.year) - Number(b.year)) : [];

  // chart sizing
  const ticks = yearlyData.map((d) => d.year);
  const EXTRA_RIGHT_PADDING = 60;
  const chartWidth = Math.max(yearlyData.length * 60, 900) + EXTRA_RIGHT_PADDING;

  // overlay / labeling helpers
  function createNumericOverlays(clone) {
    const overlays = [];
    try {
      const allSvgTexts = clone.querySelectorAll("svg text");
      const cloneRect = clone.getBoundingClientRect();
      allSvgTexts.forEach((txtEl) => {
        const txt = (txtEl.textContent || "").trim();
        if (!txt) return;
        // numeric-like patterns (integers/floats with optional commas)
        if (!/^[+\-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?$/.test(txt) && !/^\d+(\.\d+)?$/.test(txt)) return;
        try {
          const r = txtEl.getBoundingClientRect();
          const div = document.createElement("div");
          div.textContent = txt;
          div.style.position = "absolute";
          div.style.left = `${Math.round(r.left - cloneRect.left)}px`;
          div.style.top = `${Math.round(r.top - cloneRect.top)}px`;
          const cs = window.getComputedStyle(txtEl);
          div.style.fontSize = cs.fontSize || "12px";
          div.style.fontFamily = cs.fontFamily || "Arial, Helvetica, sans-serif";
          div.style.color = "#222";
          div.style.fontWeight = "600";
          div.style.pointerEvents = "none";
          div.style.lineHeight = "1";
          clone.appendChild(div);
          overlays.push(div);
        } catch (e) {
          // ignore per-node overlay errors
        }
      });
    } catch (err) {
      // ignore
    }
    return overlays;
  }

  /* ---------------- Export PDF (landscape, robust) ---------------- */
  const exportAsPDF = async () => {
    if (!printRef.current || !stats) {
      alert("Nothing to export — please Get Stats first.");
      return;
    }

    // set timestamp to be printed
    const now = new Date();
    const tsStr = now.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setExportTimestamp(tsStr);

    // wait fonts + tiny delay
    await document.fonts?.ready?.catch(() => {});
    await new Promise((r) => setTimeout(r, 100));

    // ensure SVGs are ready
    await waitForChartsReady(printRef.current, { timeout: FETCH_TIMEOUT, interval: 80 });

    setGeneratingPdf(true);

    const originalNode = printRef.current;
    const clone = originalNode.cloneNode(true);

    // place clone off-screen
    clone.style.position = "absolute";
    clone.style.top = "-12000px";
    clone.style.left = "-12000px";
    clone.style.width = `${Math.max(originalNode.getBoundingClientRect().width, window.innerWidth - 40)}px`;
    clone.style.background = "#ffffff";
    clone.style.color = "#222";
    clone.style.fontFamily = "Arial, Helvetica, sans-serif";
    clone.style.visibility = "visible";
    clone.style.zIndex = "9999";

    document.body.appendChild(clone);

    try {
      copyComputedStylesRecursive(originalNode, clone);
    } catch (err) {
      console.warn("style copy warning:", err);
    }

    // ensure svg text dark
    try {
      const svgTextNodes = clone.querySelectorAll("svg text, .recharts-legend-wrapper text, .recharts-cartesian-axis-tick-value, .recharts-tooltip-wrapper");
      svgTextNodes.forEach((t) => {
        try {
          t.style.fill = "#222";
          t.style.color = "#222";
          t.setAttribute && t.setAttribute("fill", "#222");
        } catch (e) {}
      });
    } catch {}

    // force chart wrapper sizes in clone
    const chartEls = clone.querySelectorAll(".chart");
    chartEls.forEach((el) => {
      el.style.width = `${chartWidth}px`;
      el.style.minWidth = `${chartWidth}px`;
      el.style.height = `${Math.max(300, el.getBoundingClientRect().height || 300)}px`;
    });

    // create overlays for numeric svg text nodes
    createNumericOverlays(clone);

    // let clone layout settle
    await new Promise((r) => setTimeout(r, 500));

    try {
      const [{ default: html2canvas }, jsPDFModule] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const { jsPDF } = jsPDFModule;

      // capture clone
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // cleanup clone early
      try { document.body.removeChild(clone); } catch (e) {}

      // create landscape PDF
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 18;
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const availW = pdfW - margin * 2;
      const availH = pdfH - margin * 2;

      const scale = availW / canvas.width;
      const pageHpx = Math.floor(availH / scale);

      // overlap in px to avoid seam cut on slices
      let overlapPx = Math.ceil((40 / scale));
      overlapPx = Math.min(overlapPx, Math.max(8, Math.floor(pageHpx / 4)));
      if (pageHpx <= overlapPx) overlapPx = Math.max(1, Math.floor(pageHpx / 10));

      let position = 0;
      let pageIndex = 0;

      while (position < canvas.height) {
        const remaining = canvas.height - position;
        const sliceH = Math.min(pageHpx, remaining);
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = sliceH;
        const tctx = tmpCanvas.getContext("2d");
        tctx.drawImage(canvas, 0, position, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const tmpImg = tmpCanvas.toDataURL("image/png");
        const tmpImgHeight = sliceH * scale;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(tmpImg, "PNG", margin, margin, availW, tmpImgHeight);

        pageIndex += 1;

        if (remaining <= pageHpx) {
          position = canvas.height;
        } else {
          const advance = Math.max(1, sliceH - overlapPx);
          position += advance;
        }
      }

      const safeFaculty = (stats.faculty || faculty || "faculty").replace(/\s+/g, "_");
      const fname = `faculty_stats_${safeFaculty}_${now.toISOString().replace(/[:.-]/g, "")}.pdf`;
      pdf.save(fname);
    } catch (err) {
      console.error("PDF export failed:", err);
      try { document.body.removeChild(clone); } catch (e) {}
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Faculty Stats</h2>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            list="faculty-list"
            placeholder="Faculty Name (pick or type, e.g., Sajid Ali)"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            style={inputStyle}
            aria-label="Faculty name"
          />
          <datalist id="faculty-list">
            {faculties.map((f) => <option key={f} value={f} />)}
          </datalist>

          <button
            onClick={fetchFaculties}
            title="Refresh faculty list"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "none",
              background: "#1976d2",
              color: "#fff",
              cursor: facLoading ? "default" : "pointer",
            }}
            disabled={facLoading}
          >
            {facLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <button onClick={handleGetStats} style={buttonStyle} disabled={loading}>
          {loading ? "Loading..." : "Get Stats"}
        </button>

        <button onClick={clearStats} style={{ ...buttonStyle, background: "#888", marginLeft: 6 }}>
          Clear
        </button>

        <button
          onClick={exportAsPDF}
          style={{
            ...buttonStyle,
            background: stats ? (generatingPdf ? "#5aa6e6" : "#0b74de") : "#9fc6f0",
            marginLeft: 6,
            padding: "8px 12px",
            fontSize: 13,
          }}
          disabled={!stats || generatingPdf}
          title="Export the displayed charts & summary to PDF (landscape)"
        >
          {generatingPdf ? "Generating PDF..." : "⬇️ Export PDF"}
        </button>
      </div>

      {facError && <div style={{ marginTop: 8, color: "#b00020", fontWeight: 600 }}>Faculty list: {facError}</div>}
      {error && <div style={{ marginTop: 14, color: "#b00020", fontWeight: 600 }}>{error}</div>}

      {/* printable area — only this will be exported */}
      <div ref={printRef} style={{ marginTop: 20 }}>
        {stats && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f7f9fb", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>{stats.faculty}</div>
                <div style={{ marginTop: 6, color: "#444", fontSize: 14 }}>Total Publications: <strong>{stats.total_publications}</strong></div>
              </div>
              <div style={{ textAlign: "right", color: "#333", fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>Generated</div>
                <div>{exportTimestamp || new Date().toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Role Pie */}
              <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h4 style={{ marginTop: 0 }}>Role Distribution</h4>
                {roleData.length === 0 ? (
                  <p style={{ color: "#666" }}>No role data available.</p>
                ) : (
                  <div className="chart" style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {roleData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Status Pie */}
              <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h4 style={{ marginTop: 0 }}>Status Distribution</h4>
                {statusData.length === 0 ? (
                  <p style={{ color: "#666" }}>No status data available.</p>
                ) : (
                  <div className="chart" style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Yearly Line chart (span two columns) */}
              <div style={{ gridColumn: "1 / -1", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h4 style={{ marginTop: 0 }}>Publications Over Time</h4>
                {yearlyData.length === 0 ? (
                  <p style={{ color: "#666" }}>No yearly data available.</p>
                ) : (
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" interval={0} angle={-60} textAnchor="end" height={70} tick={{ fill: "#333", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#333", fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }}>
                          <LabelList dataKey="count" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const inputStyle = {
  width: "320px",
  padding: "10px",
  margin: "0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

const buttonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "6px",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
  marginTop: 0,
  fontSize: "14px",
};

export const cardStyle = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

export const checkboxLabel = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #eee",
  background: "#fafafa",
  cursor: "pointer",
  fontSize: 14,
  color: "#222",
  userSelect: "none",
};
