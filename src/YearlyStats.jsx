// YearlyStats.jsx
// Yearly stats with per-year breakdowns by publication type + affiliation
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
  ResponsiveContainer,
} from "recharts";

/* ---------------- fixed options ---------------- */
const PUB_TYPES = ["Book Chapter", "Article", "Book"];
const AFFILIATIONS = ["IED", "Alumni/Student", "External", "PDCN", "PDCC"];

/* ---------------- backend config ---------------- */
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

/* ---------------- New: compute per-year breakdown from raw publications ----------------
   We fetch /get-publications (authenticated) and aggregate per year:
   - dedupe by normalized title per year (to match statistics endpoint behavior)
   - count publication types & affiliations from the deduped unique titles
*/
async function fetchPublicationsRaw() {
  const resp = await fetch(`${BASE_URL}/get-publications`, {
    headers: { Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`) },
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${resp.statusText}`);
  }
  const j = await resp.json();
  // endpoint sometimes responds {data: [...] } or [...]
  return Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : (j.data || []);
}

function computeBreakdowns(rawPubs = [], start, end, selectedPubTypes = [], selectedAffiliations = []) {
  // selected filters are used only for filtering the dataset we aggregate from (if you want
  // to see breakdown of all items even when filtered, call with empty selectedPubTypes/selectedAffiliations).
  const lowerTypes = (selectedPubTypes || []).map((s) => String(s).toLowerCase());
  const lowerAffs = (selectedAffiliations || []).map((s) => String(s).toLowerCase());

  const yearMap = new Map(); // year -> { titles: Map(normTitle -> row), types: Map, affs: Map }

  for (const r of rawPubs) {
    const rawYear = r.Year ?? r.year ?? null;
    const y = Number(rawYear);
    if (Number.isNaN(y)) continue;
    if (y < start || y > end) continue;

    // apply frontend filters: if filters present, only include rows matching them
    if (lowerTypes.length) {
      const ptype = String(r["Publication Type"] || r.publicationType || "").toLowerCase();
      if (!lowerTypes.includes(ptype)) continue;
    }
    if (lowerAffs.length) {
      const aff = String(r.Affiliation || r.affiliation || "").toLowerCase();
      if (!lowerAffs.includes(aff)) continue;
    }

    const title = (r.Title || r.title || "").trim();
    if (!title) continue;
    const norm = title.toLowerCase();

    if (!yearMap.has(y)) {
      yearMap.set(y, { titles: new Map(), types: new Map(), affs: new Map() });
    }
    const bucket = yearMap.get(y);
    // dedupe by normalized title: keep first occurrence
    if (!bucket.titles.has(norm)) {
      bucket.titles.set(norm, r);
      const ptype = (r["Publication Type"] || r.publicationType || "").trim() || "Unknown";
      const aff = (r.Affiliation || r.affiliation || "").trim() || "Unknown";

      bucket.types.set(ptype, (bucket.types.get(ptype) || 0) + 1);
      bucket.affs.set(aff, (bucket.affs.get(aff) || 0) + 1);
    }
  }

  // convert to plain objects
  const out = {};
  for (const [year, v] of yearMap.entries()) {
    out[year] = {
      publication_types: Object.fromEntries(Array.from(v.types.entries())),
      affiliations: Object.fromEntries(Array.from(v.affs.entries())),
      unique_titles_count: v.titles.size,
    };
  }
  return out;
}

/* ---------------- Custom Tooltip ---------------- */
function CustomTooltip({ active, payload, label, breakdowns, filtersApplied }) {
  if (!active || !payload || payload.length === 0) return null;
  // label is the year
  const year = label;
  const bd = breakdowns && breakdowns[year] ? breakdowns[year] : null;

  // find main value from payload (usually payload[0].value)
  const main = payload[0]?.value ?? null;

  return (
    <div style={{
      background: "#fff", color: "#222", border: "1px solid #ddd", padding: 10, borderRadius: 6, minWidth: 200, boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{year}</div>
      <div style={{ marginBottom: 8 }}>
        <div><strong>Total:</strong> {main}</div>
        {filtersApplied && filtersApplied.year_filter_applied && <div style={{ fontSize: 12, color: "#666" }}> (filters applied)</div>}
      </div>

      {bd ? (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ minWidth: 110 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>By Publication Type</div>
            {Object.keys(bd.publication_types).length === 0 ? <div style={{ fontSize: 12, color: "#666" }}>—</div> :
              Object.entries(bd.publication_types).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{k}</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{v}</span>
                </div>
              ))
            }
          </div>

          <div style={{ minWidth: 110 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>By Affiliation</div>
            {Object.keys(bd.affiliations).length === 0 ? <div style={{ fontSize: 12, color: "#666" }}>—</div> :
              Object.entries(bd.affiliations).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{k}</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{v}</span>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#666" }}>No breakdown available for this year.</div>
      )}
    </div>
  );
}

/* ---------------- main component ---------------- */
export default function YearlyStats() {
  // filter UI state
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);
  const [selectedPubTypes, setSelectedPubTypes] = useState([]);
  const [selectedAffiliations, setSelectedAffiliations] = useState([]);

  // data + breakdowns
  const [data, setData] = useState([]);
  const [breakdowns, setBreakdowns] = useState({}); // { year: { publication_types: {}, affiliations: {}, unique_titles_count } }
  const [filtersApplied, setFiltersApplied] = useState(null);

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // printable area refs + export state
  const printRef = useRef(null);
  const [exportTimestamp, setExportTimestamp] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    setData([]);
    setFiltersApplied(null);
    setBreakdowns({});
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
    setBreakdowns({});
    setFiltersApplied(null);
    setError("");
  };

  // Request summary stats from backend (existing endpoint) AND fetch raw publications to compute breakdowns
  const requestStats = async () => {
    setError("");
    if (Number(startYear) > Number(endYear)) {
      setError("Start Year must be ≤ End Year.");
      return;
    }

    setLoading(true);
    try {
      // 1) fetch summary statistics (fast)
      const params = new URLSearchParams();
      if (startYear !== "" && startYear !== null && startYear !== undefined) params.append("start_year", String(Number(startYear)));
      if (endYear !== "" && endYear !== null && endYear !== undefined) params.append("end_year", String(Number(endYear)));
      selectedPubTypes.forEach((pt) => params.append("publication_types", pt));
      selectedAffiliations.forEach((af) => params.append("affiliations", af));

      const url = `${BASE_URL}/statistics/publications?${params.toString()}`;
      const resp = await fetch(url, { method: "GET", headers: { Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`) } });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Server returned ${resp.status}`);
      }
      const json = await resp.json();
      let stats = Array.isArray(json.statistics) ? json.statistics.slice() : [];
      // sort ascending
      stats.sort((a, b) => Number(a.year) - Number(b.year));
      // derive range to fill
      const s = startYear !== "" && startYear !== null ? Number(startYear) : (stats.length ? Number(stats[0].year) : 2000);
      const e = endYear !== "" && endYear !== null ? Number(endYear) : (stats.length ? Number(stats[stats.length - 1].year) : 2025);
      const filled = fillYearsWithZeros(stats, s, e);

      // 2) fetch raw pubs and compute breakdowns (deduped by normalized title per year)
      const rawPubs = await fetchPublicationsRaw();
      const computed = computeBreakdowns(rawPubs, s, e, selectedPubTypes, selectedAffiliations);

      // 3) attach breakdowns into filled data for tooltip consumption
      const merged = filled.map((it) => {
        const y = Number(it.year);
        const bd = computed[y] || { publication_types: {}, affiliations: {}, unique_titles_count: 0 };
        return {
          ...it,
          // attach breakdowns as plain objects (safe for serialization)
          pub_type_counts: bd.publication_types,
          affiliation_counts: bd.affiliations,
        };
      });

      setData(merged);
      setBreakdowns(computed);
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
      setBreakdowns({});
      setFiltersApplied(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Export PDF: reuse robust splitting technique (portrait by default) ---
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

    await document.fonts?.ready?.catch(() => {});
    await new Promise((r) => setTimeout(r, 120));
    await waitForChartsReady(printRef.current, { timeout: 4000, interval: 80 });

    setGeneratingPdf(true);
    const originalNode = printRef.current;
    const clone = originalNode.cloneNode(true);

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

    try { copyComputedStylesRecursive(originalNode, clone); } catch (e) { /* ignore */ }

    // ensure svg text dark
    try {
      const svgTextNodes = clone.querySelectorAll("svg text, .recharts-legend-wrapper text, .recharts-cartesian-axis-tick-value, .recharts-tooltip-wrapper");
      svgTextNodes.forEach((t) => {
        try { t.style.fill = "#222"; t.style.color = "#222"; t.setAttribute && t.setAttribute("fill", "#222"); } catch (e) {}
      });
    } catch (e) {}

    // force chart wrapper sizes
    const chartEls = clone.querySelectorAll(".chart");
    const chartWidth = Math.max(data.length * 60, 900) + 60;
    chartEls.forEach((el) => {
      el.style.width = `${chartWidth}px`;
      el.style.minWidth = `${chartWidth}px`;
      el.style.height = `${Math.max(320, el.getBoundingClientRect().height || 320)}px`;
    });

    // small delay
    await new Promise((r) => setTimeout(r, 500));

    try {
      const [{ default: html2canvas }, jsPDFModule] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const { jsPDF } = jsPDFModule;
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", logging: false });
      try { document.body.removeChild(clone); } catch (e) {}
      // build pdf (landscape often fits wide charts better)
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 18;
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const availW = pdfW - margin * 2;
      const availH = pdfH - margin * 2;
      const scale = availW / canvas.width;
      const pageHpx = Math.floor(availH / scale);
      let overlapPx = Math.ceil((40 / scale));
      overlapPx = Math.min(overlapPx, Math.max(8, Math.floor(pageHpx / 4)));
      if (pageHpx <= overlapPx) overlapPx = Math.max(1, Math.floor(pageHpx / 10));
      let position = 0;
      let pageIndex = 0;
      while (position < canvas.height) {
        const remaining = canvas.height - position;
        const sliceH = Math.min(pageHpx, remaining);
        const tmpC = document.createElement("canvas");
        tmpC.width = canvas.width;
        tmpC.height = sliceH;
        const tctx = tmpC.getContext("2d");
        tctx.drawImage(canvas, 0, position, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const tmpImg = tmpC.toDataURL("image/png");
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
      const safeFilters = (filtersApplied && (filtersApplied.publication_types || []).join("+")) || "ALL";
      const fname = `yearly_stats_${safeFilters}_${now.toISOString().replace(/[:.-]/g, "")}.pdf`;
      pdf.save(fname);
    } catch (err) {
      console.error("PDF export failed:", err);
      try { document.body.removeChild(clone); } catch (e) {}
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // layout values derived from data
  const ticks = data.map((d) => d.year);
  const EXTRA_RIGHT_PADDING = 80;
  const chartWidth = Math.max(data.length * 60, 900) + EXTRA_RIGHT_PADDING;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Yearly Statistics</h2>

      {/* controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13 }}>Start Year</label>
          <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : "")} min={1993} max={2025}
                 style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13 }}>End Year</label>
          <input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : "")} min={1993} max={2025}
                 style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 120 }} />
        </div>

        <div>
          <button onClick={requestStats} disabled={loading} style={{ ...buttonStyle, marginRight: 8 }}>{loading ? "Requesting..." : "Request Stats"}</button>
          <button onClick={resetAll} style={{ ...buttonStyle, background: "#888" }}>Reset</button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={exportAsPDF} disabled={generatingPdf || data.length === 0} style={{
            ...buttonStyle,
            background: data.length ? (generatingPdf ? "#5aa6e6" : "#0b74de") : "#9fc6f0",
            padding: "8px 12px",
            fontSize: 13,
          }}>
            {generatingPdf ? "Generating PDF..." : "⬇️ Export PDF"}
          </button>
        </div>
      </div>

      {/* filters */}
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
        <div style={{ fontWeight: 600 }}>{filtersApplied ? (
          (() => {
            const parts = [];
            if (filtersApplied.publication_types && filtersApplied.publication_types.length) parts.push(`Types: ${filtersApplied.publication_types.join(", ")}`);
            if (filtersApplied.affiliations && filtersApplied.affiliations.length) parts.push(`Affiliations: ${filtersApplied.affiliations.join(", ")}`);
            if (filtersApplied.year_filter_applied && data.length) parts.push(`Years: ${data[0].year}–${data[data.length-1].year}`);
            return `Filters applied: ${parts.join(" • ")} (categories: ${filtersApplied.categories})`;
          })()
        ) : "Filters: none"}</div>
      </div>

      {error && <div style={{ marginBottom: 12, color: "#b00020", fontWeight: 600 }}>{error}</div>}

      {/* printable area */}
      <div ref={printRef} style={{ paddingBottom: 20 }}>
        {data.length === 0 ? (
          <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>No data — click <b>Request Stats</b>.</div>
        ) : (
          <>
            <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f7f9fb", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Yearly Publications</div>
                <div style={{ marginTop: 6, color: "#444", fontSize: 13 }}>{filtersApplied ? `Filters applied: ${filtersApplied.categories} category(s)` : "No filters applied"}</div>
              </div>
              <div style={{ textAlign: "right", color: "#333", fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>Generated</div>
                <div>{exportTimestamp || new Date().toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {/* Publications Over Time */}
              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Publications Over Time</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <LineChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING/2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip breakdowns={breakdowns} filtersApplied={filtersApplied} />} />
                      <Legend />
                      <Line type="monotone" dataKey="publications" stroke="#2f6fb2" name="Publications" dot={{ r: 4 }}>
                        <LabelList dataKey="publications" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                      </Line>
                    </LineChart>
                  </div>
                </div>
              </section>

              {/* Unique Contributors */}
              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Unique Contributors</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <BarChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING/2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip breakdowns={breakdowns} filtersApplied={filtersApplied} />} />
                      <Legend />
                      <Bar dataKey="unique_contributors" fill="#69a973" name="Unique Contributors">
                        <LabelList dataKey="unique_contributors" position="top" formatter={(v) => (v === 0 ? "" : String(v))} />
                      </Bar>
                    </BarChart>
                  </div>
                </div>
              </section>

              {/* Avg Authors */}
              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 10px 0" }}>Avg. Authors per Publication</h3>
                <div style={{ overflowX: "auto" }}>
                  <div className="chart" style={{ width: chartWidth, minWidth: 900, paddingRight: EXTRA_RIGHT_PADDING }}>
                    <LineChart width={chartWidth} height={320} data={data} margin={{ top: 5, right: EXTRA_RIGHT_PADDING/2, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" ticks={ticks} interval={0} angle={-90} textAnchor="end" height={90} tickMargin={8} tick={{ fill: "#333", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#333", fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip breakdowns={breakdowns} filtersApplied={filtersApplied} />} />
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
const buttonStyle = { padding: "8px 14px", borderRadius: 6, border: "none", background: "#1976d2", color: "#fff", cursor: "pointer" };
const cardStyle = { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };
const checkboxLabel = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, border: "1px solid #eee", background: "#fafafa", cursor: "pointer", fontSize: 14, color: "#222", userSelect: "none" };
