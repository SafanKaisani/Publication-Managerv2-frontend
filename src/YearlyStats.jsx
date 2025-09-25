// YearlyStats.jsx (patched export slicing to avoid final-page cutoff)
import React, { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";

/* ---------------- fixed options ---------------- */
const PUB_TYPES = ["Book Chapter", "Article", "Book"];
const AFFILIATIONS = ["IED", "Alumni/Student", "External", "PDCN", "PDCC"];

/* ---------------- backend config (edit if needed) ---------------- */
const BASE_URL = "http://127.0.0.1:8000";
const USERNAME = "admin";
const PASSWORD = "supersecretpassword";

/* ---------------- helpers ---------------- */
function fillYearsWithZeros(statsArray, start, end) {
  const map = new Map(statsArray.map((s) => [Number(s.year), s]));
  const out = [];
  for (let y = start; y <= end; y++) {
    if (map.has(y)) {
      out.push(map.get(y));
    } else {
      out.push({
        year: y,
        publications: 0,
        unique_contributors: 0,
        average_authors_per_publication: 0,
      });
    }
  }
  return out;
}

async function waitForChartsReady(container, { timeout = 4000, interval = 80 } = {}) {
  if (!container) return false;
  const start = Date.now();
  function check() {
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
  }
  while (Date.now() - start < timeout) {
    if (check()) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

function copyComputedStylesRecursive(sourceRoot, targetRoot) {
  try {
    const srcWalker = [sourceRoot];
    const tgtWalker = [targetRoot];
    while (srcWalker.length) {
      const src = srcWalker.shift();
      const tgt = tgtWalker.shift();
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
      } catch (e) {}
      const srcChildren = Array.from(src.children || []);
      const tgtChildren = Array.from(tgt.children || []);
      for (let i = 0; i < srcChildren.length; i++) {
        srcWalker.push(srcChildren[i]);
        tgtWalker.push(tgtChildren[i] || srcChildren[i].cloneNode(false));
      }
    }
  } catch (err) {
    // silent fallback
  }
}

/* ---------------- component ---------------- */
export default function YearlyStats() {
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);
  const [selectedPubTypes, setSelectedPubTypes] = useState([]);
  const [selectedAffiliations, setSelectedAffiliations] = useState([]);

  const [data, setData] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const printRef = useRef(null);
  const [exportTimestamp, setExportTimestamp] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    setData([]);
    setFiltersApplied(null);
  }, []);

  const toggle = (arr, setArr, item) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const resetAll = () => {
    setStartYear(2000);
    setEndYear(2025);
    setSelectedPubTypes([]);
    setSelectedAffiliations([]);
    setData([]);
    setFiltersApplied(null);
    setError("");
  };

  const requestStats = async () => {
    setError("");
    if (Number(startYear) > Number(endYear)) {
      setError("Start Year must be ≤ End Year.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startYear !== "" && startYear !== null && startYear !== undefined) params.append("start_year", String(Number(startYear)));
      if (endYear !== "" && endYear !== null && endYear !== undefined) params.append("end_year", String(Number(endYear)));
      selectedPubTypes.forEach((pt) => params.append("publication_types", pt));
      selectedAffiliations.forEach((af) => params.append("affiliations", af));

      const url = `${BASE_URL}/statistics/publications?${params.toString()}`;

      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
        },
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Server returned ${resp.status}`);
      }

      const json = await resp.json();
      let stats = Array.isArray(json.statistics) ? json.statistics.slice() : [];
      stats.sort((a, b) => Number(a.year) - Number(b.year));

      const s = startYear !== "" && startYear !== null ? Number(startYear) : (stats.length ? Number(stats[0].year) : 2000);
      const e = endYear !== "" && endYear !== null ? Number(endYear) : (stats.length ? Number(stats[stats.length - 1].year) : 2025);

      const filled = fillYearsWithZeros(stats, s, e);

      setData(filled);
      setFiltersApplied(json.filters_applied || {
        categories: (startYear || endYear ? 1 : 0) + (selectedPubTypes.length ? 1 : 0) + (selectedAffiliations.length ? 1 : 0),
        publication_types: selectedPubTypes,
        affiliations: selectedAffiliations,
        year_filter_applied: Boolean(startYear || endYear),
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch statistics");
      setData([]);
      setFiltersApplied(null);
    } finally {
      setLoading(false);
    }
  };

  const ticks = data.map((d) => d.year);
  const EXTRA_RIGHT_PADDING = 80;
  const chartWidth = Math.max(data.length * 60, 900) + EXTRA_RIGHT_PADDING;

  const filtersTitle = () => {
    if (!filtersApplied) return "Filters: none";
    const parts = [];
    if (filtersApplied.publication_types && filtersApplied.publication_types.length) parts.push(`Types: ${filtersApplied.publication_types.join(", ")}`);
    if (filtersApplied.affiliations && filtersApplied.affiliations.length) parts.push(`Affiliations: ${filtersApplied.affiliations.join(", ")}`);
    if (filtersApplied.year_filter_applied) {
      const years = data.length ? `${data[0].year}–${data[data.length - 1].year}` : "";
      if (years) parts.push(`Years: ${years}`);
    }
    const joined = parts.length ? parts.join(" • ") : "No filters applied";
    return `Filters applied: ${joined} (categories: ${filtersApplied.categories})`;
  };

  /* ---------------- Export PDF (robust, final-slice safe) ---------------- */
  const exportAsPDF = async () => {
    if (!printRef.current || data.length === 0) {
      alert("Nothing to export — please Request Stats first.");
      return;
    }

    const now = new Date();
    const tsStr = now.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setExportTimestamp(tsStr);

    // wait for fonts + charts stabilization
    await document.fonts?.ready?.catch(() => {});
    await new Promise((r) => setTimeout(r, 120));
    await waitForChartsReady(printRef.current, { timeout: 4000, interval: 80 });

    setGeneratingPdf(true);

    const originalNode = printRef.current;
    const clone = originalNode.cloneNode(true);

    // position clone off-screen to avoid layout shifts
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
      // copy computed styles into clone (best-effort)
      copyComputedStylesRecursive(originalNode, clone);
    } catch (err) {
      console.warn("style copy warning:", err);
    }

    // make SVG texts visible/dark on clone
    try {
      const svgTextNodes = clone.querySelectorAll("svg text, .recharts-legend-wrapper text, .recharts-cartesian-axis-tick-value, .recharts-tooltip-wrapper");
      svgTextNodes.forEach((t) => {
        try {
          t.style.fill = "#222";
          t.style.color = "#222";
          t.setAttribute && t.setAttribute("fill", "#222");
        } catch (e) {}
      });
    } catch (e) {}

    // force chart wrapper sizes in clone so Recharts renders at full width
    const chartEls = clone.querySelectorAll(".chart");
    chartEls.forEach((el) => {
      el.style.width = `${chartWidth}px`;
      el.style.minWidth = `${chartWidth}px`;
      el.style.height = `${Math.max(320, el.getBoundingClientRect().height || 320)}px`;
    });

    // overlay numeric SVG <text> with absolutely positioned HTML nodes in clone
    try {
      const allSvgTexts = clone.querySelectorAll("svg text");
      const cloneRect = clone.getBoundingClientRect();
      allSvgTexts.forEach((txtEl) => {
        const txt = (txtEl.textContent || "").trim();
        if (!txt) return;
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
          div.style.transform = "translate(0, 0)";
          clone.appendChild(div);
        } catch (e) {}
      });
    } catch (err) {
      // ignore overlay errors
    }

    // small delay to allow repaint in clone
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

      // remove clone early (cleanup) to avoid holding the DOM during heavy PDF ops
      try { document.body.removeChild(clone); } catch (e) {}

      // build PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const margin = 20; // pt
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const availW = pdfW - margin * 2;
      const availH = pdfH - margin * 2;

      const scale = availW / canvas.width;
      const pageHpx = Math.floor(availH / scale);

      // overlap (px) converted from ~40pt to px via scale, capped to reasonable amount
      let overlapPx = Math.ceil((40 / scale));
      overlapPx = Math.min(overlapPx, Math.max(10, Math.floor(pageHpx / 4)));

      // ensure pageHpx > overlapPx
      if (pageHpx <= overlapPx) {
        overlapPx = Math.max(1, Math.floor(pageHpx / 10));
      }

      // now robustly iterate until we reach bottom; guarantee final slice covers end
      let position = 0;
      let pageIndex = 0;
      console.info(`[PDF Export] canvasH=${canvas.height}px pageHpx=${pageHpx}px overlapPx=${overlapPx}px scale=${scale.toFixed(3)}`);

      while (position < canvas.height) {
        const remaining = canvas.height - position;
        const sliceH = Math.min(pageHpx, remaining);
        // create slice canvas
        const tmpC = document.createElement("canvas");
        tmpC.width = canvas.width;
        tmpC.height = sliceH;
        const tctx = tmpC.getContext("2d");
        tctx.drawImage(canvas, 0, position, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const tmpImg = tmpC.toDataURL("image/png");
        const imgHOnPage = sliceH * scale;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(tmpImg, "PNG", margin, margin, availW, imgHOnPage);

        pageIndex += 1;

        // advance position: normally by sliceH - overlapPx.
        // If the slice was the remainder (remaining <= pageHpx), break after drawing.
        if (remaining <= pageHpx) {
          position = canvas.height; // done
        } else {
          // advance but ensure progress
          const advance = Math.max(1, sliceH - overlapPx);
          position += advance;
        }
      }

      const safeFilters = (filtersApplied && (filtersApplied.publication_types || []).join("+")) || "ALL";
      const fname = `yearly_stats_${safeFilters}_${now.toISOString().replace(/[:.-]/g, "")}.pdf`;
      pdf.save(fname);
      console.info(`[PDF Export] saved ${pageIndex} pages`);
    } catch (err) {
      console.error("PDF export failed:", err);
      try { document.body.removeChild(clone); } catch (e) {}
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Yearly Statistics</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13 }}>Start Year</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : "")}
            min={1993}
            max={2025}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13 }}>End Year</label>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : "")}
            min={1993}
            max={2025}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }}
          />
        </div>

        <div>
          <button onClick={requestStats} disabled={loading} style={{ ...buttonStyle, marginRight: 8 }}>
            {loading ? "Requesting..." : "Request Stats"}
          </button>
          <button onClick={resetAll} style={{ ...buttonStyle, background: "#888" }}>
            Reset
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={exportAsPDF}
            disabled={generatingPdf || data.length === 0}
            style={{
              ...buttonStyle,
              background: data.length ? (generatingPdf ? "#5aa6e6" : "#0b74de") : "#9fc6f0",
              padding: "8px 12px",
              fontSize: 13,
            }}
            title="Export visible charts & summary to PDF"
          >
            {generatingPdf ? "Generating PDF..." : "⬇️ Export PDF"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Publication Types</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PUB_TYPES.map((pt) => (
              <label key={pt} style={checkboxLabel}>
                <input type="checkbox" checked={selectedPubTypes.includes(pt)} onChange={() => toggle(selectedPubTypes, setSelectedPubTypes, pt)} />
                <span style={{ marginLeft: 6 }}>{pt}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Affiliations</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {AFFILIATIONS.map((af) => (
              <label key={af} style={checkboxLabel}>
                <input type="checkbox" checked={selectedAffiliations.includes(af)} onChange={() => toggle(selectedAffiliations, setSelectedAffiliations, af)} />
                <span style={{ marginLeft: 6 }}>{af}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#f3f6f8", padding: "10px 12px", borderRadius: 8, marginBottom: 14, color: "#222" }}>
        <div style={{ fontWeight: 600 }}>{filtersApplied ? filtersTitle() : "Filters: none"}</div>
      </div>

      {error && <div style={{ marginBottom: 12, color: "#b00020", fontWeight: 600 }}>{error}</div>}

      <div ref={printRef} style={{ paddingBottom: 20 }}>
        {data.length === 0 ? (
          <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>No data — click <b>Request Stats</b>.</div>
        ) : (
          <>
            <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f7f9fb", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Yearly Publications</div>
                <div style={{ marginTop: 6, color: "#444", fontSize: 13 }}>{filtersApplied ? filtersTitle() : "No filters applied"}</div>
              </div>
              <div style={{ textAlign: "right", color: "#333", fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>Generated</div>
                <div>{exportTimestamp || new Date().toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Publications Over Time</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <LineChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="publications" stroke="#2f6fb2" name="Publications" dot={{ r: 4 }}>
                        <LabelList dataKey="publications" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                      </Line>
                    </LineChart>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Unique Contributors</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <BarChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="unique_contributors" fill="#69a973" name="Unique Contributors">
                        <LabelList dataKey="unique_contributors" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                      </Bar>
                    </BarChart>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Avg. Authors per Publication</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <LineChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING / 2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="average_authors_per_publication" stroke="#ff8a00" name="Avg Authors" dot={{ r: 4 }}>
                        <LabelList dataKey="average_authors_per_publication" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                      </Line>
                    </LineChart>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */
const buttonStyle = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
};

const cardStyle = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const checkboxLabel = {
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
