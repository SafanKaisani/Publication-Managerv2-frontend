// UpdatePublication.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";
// dev basic auth (replace later with env vars / login)
const USERNAME = "admin";
const PASSWORD = "supersecretpassword";

const PUB_TYPES = ["", "Book Chapter", "Article", "Book"];
const AFFILIATIONS = ["", "IED", "Alumni/Student", "External", "PDCN", "PDCC"];
const ROLE_OPTIONS = ["", "Main Author", "Secondary Author"];

export default function UpdatePublication() {
  const loc = useLocation();
  const navPub = loc.state?.publication ?? null;

  // pubId can come from navPub.id or user-entered
  const [pubId, setPubId] = useState(navPub?.id ?? "");
  const [loadingPub, setLoadingPub] = useState(false);
  const autoLoadedRef = useRef(false); // avoid double auto-load

  // form uses short keys but the payload will map to exact DB column names
  const [form, setForm] = useState({
    entryDate: "",
    faculty: "",
    publicationType: "",
    year: "",
    title: "",
    role: "",
    affiliation: "",
    status: "",
    reference: "",
    theme: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Helper: load full publication by id and populate the form
  const loadPublicationById = async (id) => {
    if (!id) return;
    setLoadingPub(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);
      const res = await fetch(`${BASE_URL}/get-publications`, {
        method: "GET",
        headers: {
          Authorization: basic,
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      const pubs = Array.isArray(json.data) ? json.data : json;
      const target = pubs.find((p) => String(p.id) === String(id));
      if (!target) throw new Error(`Publication with id ${id} not found on server`);
      // fill form with full object
      setForm({
        entryDate: target["Entry Date"] ?? target.entryDate ?? "",
        faculty: target.Faculty ?? target.faculty ?? "",
        publicationType: target["Publication Type"] ?? target.publicationType ?? "",
        year: (target.Year ?? target.year ?? "")?.toString?.() ?? "",
        title: target.Title ?? target.title ?? "",
        role: target.Role ?? target.role ?? "",
        affiliation: target.Affiliation ?? target.affiliation ?? "",
        status: target.Status ?? target.status ?? "",
        reference: target.Reference ?? target.reference ?? "",
        theme: target.Theme ?? target.theme ?? "",
      });
      setSuccessMsg("Loaded full publication into form (editable).");
    } catch (err) {
      console.warn("Auto-load full publication failed:", err);
      // fallback: if navPub exists, use it (set was likely already done)
      setErrorMsg(err.message || "Failed to load full publication — using partial data.");
    } finally {
      setLoadingPub(false);
    }
  };

  // If nav state provided, prefill form and *automatically* attempt to load full record by id
  useEffect(() => {
    if (!navPub) return;

    // fill with partial data immediately for faster UX
    setForm({
      entryDate: navPub["Entry Date"] ?? navPub.entryDate ?? "",
      faculty: navPub.Faculty ?? navPub.faculty ?? "",
      publicationType: navPub["Publication Type"] ?? navPub.publicationType ?? "",
      year: (navPub.Year ?? navPub.year ?? "")?.toString?.() ?? "",
      title: navPub.Title ?? navPub.title ?? "",
      role: navPub.Role ?? navPub.role ?? "",
      affiliation: navPub.Affiliation ?? navPub.affiliation ?? "",
      status: navPub.Status ?? navPub.status ?? "",
      reference: navPub.Reference ?? navPub.reference ?? "",
      theme: navPub.Theme ?? navPub.theme ?? "",
    });

    const id = navPub.id ?? navPub.ID ?? navPub.pub_id ?? navPub.pubId ?? null;
    setPubId(id ?? "");

    // auto-load full publication only once per mount
    if (id && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      // attempt to fetch full record — don't await here (effect won't block rendering)
      loadPublicationById(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navPub]);

  // If user wants to load by ID manually (when no nav state)
  const handleLoadById = async () => {
    if (!pubId) {
      setErrorMsg("Please enter a Publication ID to load.");
      return;
    }
    await loadPublicationById(pubId);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // build payload with exact DB names
  const buildPayload = () => {
    const yearVal = form.year === "" ? null : parseInt(form.year, 10) || null;
    const NoneIfEmpty = (v) => (v === "" ? null : v);
    return {
      "Entry Date": form.entryDate ? form.entryDate : NoneIfEmpty(null),
      "Faculty": form.faculty || NoneIfEmpty(null),
      "Publication Type": form.publicationType || NoneIfEmpty(null),
      "Year": form.year === "" ? NoneIfEmpty(null) : (parseInt(form.year, 10) || NoneIfEmpty(null)),
      "Title": form.title || NoneIfEmpty(null),
      "Role": form.role || NoneIfEmpty(null),
      "Affiliation": form.affiliation || NoneIfEmpty(null),
      "Status": form.status || NoneIfEmpty(null),
      "Reference": form.reference || NoneIfEmpty(null),
      "Theme": form.theme || NoneIfEmpty(null),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pubId) {
      setErrorMsg("Missing publication id. Load a publication or open from Search results.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const url = `${BASE_URL}/update-publication/${pubId}`;
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

      const res = await fetch(url, {
        method: "PUT",
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
        } catch {}
        throw new Error(msg);
      }

      const json = await res.json().catch(() => null);
      setSuccessMsg(json?.message ? `${json.message}` : "Updated");
    } catch (err) {
      console.error("Update failed:", err);
      setErrorMsg(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Update Publication</h2>
      <p style={{ color: "#555" }}>Load a publication (from Search) or enter Publication ID and press Load.</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Publication ID (e.g., 123)"
          value={pubId}
          onChange={(e) => setPubId(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", width: 200 }}
        />
        <button
          onClick={handleLoadById}
          disabled={loadingPub}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: loadingPub ? "#9fd9bd" : "#47af83",
            color: "#fff",
            cursor: loadingPub ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {loadingPub ? "Loading..." : "Load"}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
        <input name="entryDate" value={form.entryDate} onChange={onChange} placeholder='Entry Date (e.g., "2025-06-30 00:00:00")' style={inputStyle} />

        <input name="faculty" value={form.faculty} onChange={onChange} placeholder='Faculty (e.g., "Sajid Ali")' style={inputStyle} />

        {/* Publication Type dropdown */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>Publication Type</label>
        <select name="publicationType" value={form.publicationType} onChange={onChange} style={selectStyle}>
          {PUB_TYPES.map((pt) => <option key={pt} value={pt === "" ? "" : pt}>{pt === "" ? "— Select Publication Type —" : pt}</option>)}
        </select>

        <input name="year" value={form.year} onChange={onChange} type="number" placeholder="Year (e.g., 2025)" style={inputStyle} min={1900} max={2100} />

        <input name="title" value={form.title} onChange={onChange} placeholder='Title (e.g., "Generating and Implementing Research-Informed Policies...")' style={inputStyle} />

        {/* Role dropdown */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>Role</label>
        <select name="role" value={form.role} onChange={onChange} style={selectStyle}>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r === "" ? "" : r}>{r === "" ? "— Select Role —" : r}</option>)}
        </select>

        {/* Affiliation dropdown */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>Affiliation</label>
        <select name="affiliation" value={form.affiliation} onChange={onChange} style={selectStyle}>
          {AFFILIATIONS.map((af) => <option key={af} value={af === "" ? "" : af}>{af === "" ? "— Select Affiliation —" : af}</option>)}
        </select>

        <input name="status" value={form.status} onChange={onChange} placeholder='Status (e.g., "Published")' style={inputStyle} />

        <textarea name="reference" value={form.reference} onChange={onChange} placeholder="Reference (e.g., Ali, S., ...)" style={{ ...inputStyle, height: 100 }} />

        <input name="theme" value={form.theme} onChange={onChange} placeholder='Theme (e.g., "Educational Leadership and Policy")' style={inputStyle} />

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={submitting} style={{ padding: "10px 18px", borderRadius: 6, border: "none", background: submitting ? "#90caf9" : "#004974", color: "#fff", cursor: submitting ? "default" : "pointer" }}>
            {submitting ? "Updating..." : "Update Publication"}
          </button>
        </div>
      </form>

      {successMsg && <div role="status" style={{ marginTop: 12, background: "#ecf9f0", color: "#1b6e3a", padding: "10px 12px", borderRadius: 6, fontWeight: 600, display: "inline-block" }}>{successMsg}</div>}
      {errorMsg && <div role="alert" style={{ marginTop: 12, background: "#fff0f0", color: "#a00", padding: "10px 12px", borderRadius: 6, fontWeight: 600, display: "inline-block" }}>{errorMsg}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontStyle: "italic",
};

const selectStyle = {
  width: "100%",
  padding: "10px",
  margin: "6px 0 12px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  background: "#fff",
};
