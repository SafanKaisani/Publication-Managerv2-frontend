// CreatePublication.jsx
import React, { useState } from "react";

export default function CreatePublication() {
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

  // <<-- DEV CONFIG: change if needed or replace with import.meta.env vars -->> 
  const BASE_URL = "http://127.0.0.1:8000";
  const USERNAME = "admin";
  const PASSWORD = "supersecretpassword";
  // <<-- end config -->> 

  const PUB_TYPES = ["", "Book Chapter", "Article", "Book"];
  const AFFILIATIONS = ["", "IED", "Alumni/Student", "External", "PDCN", "PDCC"];
  const ROLE_OPTIONS = ["", "Main Author", "Secondary Author"];

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const buildPayload = () => {
    // payload must use exact DB column names (with spaces)
    const yearVal = form.year === "" ? null : parseInt(form.year, 10) || null;

    return {
      "Entry Date": form.entryDate ? form.entryDate : null,
      "Faculty": form.faculty || null,
      "Publication Type": form.publicationType || null,
      "Year": yearVal,
      "Title": form.title || null,
      "Role": form.role || null,
      "Affiliation": form.affiliation || null,
      "Status": form.status || null,
      "Reference": form.reference || null,
      "Theme": form.theme || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = buildPayload();
      const url = `${BASE_URL}/add-publication`;
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

      const res = await fetch(url, {
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
        } catch {}
        throw new Error(msg);
      }

      const json = await res.json().catch(() => null);
      // backend returns: { message: "Created", "publication": { ... } }
      setSuccessMsg(json?.message ? `${json.message}` : "Created");
      if (json?.publication?.id) {
        setSuccessMsg((s) => `${s} (id: ${json.publication.id})`);
      }

      // reset form
      setForm({
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
    } catch (err) {
      console.error("Create publication error:", err);
      setErrorMsg(err.message || "Failed to create publication");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create New Publication</h2>
      <p style={{ color: "#555" }}>Fill the fields below and click Create Publication.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
        <input
          name="entryDate"
          value={form.entryDate}
          onChange={onChange}
          placeholder='Entry Date (e.g., "2025-06-30 00:00:00")'
          style={inputStyle}
        />

        <input
          name="faculty"
          value={form.faculty}
          onChange={onChange}
          placeholder='Faculty (e.g., "Sajid Ali")'
          style={inputStyle}
        />

        {/* Publication Type dropdown */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>
          Publication Type
        </label>
        <select
          name="publicationType"
          value={form.publicationType}
          onChange={onChange}
          style={selectStyle}
        >
          {PUB_TYPES.map((pt) => (
            <option key={pt} value={pt === "" ? "" : pt}>
              {pt === "" ? "— Select Publication Type —" : pt}
            </option>
          ))}
        </select>

        <input
          name="year"
          value={form.year}
          onChange={onChange}
          type="number"
          placeholder="Year (e.g., 2025)"
          style={inputStyle}
          min={1900}
          max={2100}
        />

        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder='Title (e.g., "Generating and Implementing Research-Informed Policies...")'
          style={inputStyle}
        />

        {/* Role dropdown (prevents spelling mistakes) */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>
          Role
        </label>
        <select
          name="role"
          value={form.role}
          onChange={onChange}
          style={selectStyle}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r === "" ? "" : r}>
              {r === "" ? "— Select Role —" : r}
            </option>
          ))}
        </select>

        {/* Affiliation dropdown */}
        <label style={{ display: "block", marginTop: 6, marginBottom: 4, fontSize: 13, color: "#333" }}>
          Affiliation
        </label>
        <select
          name="affiliation"
          value={form.affiliation}
          onChange={onChange}
          style={selectStyle}
        >
          {AFFILIATIONS.map((af) => (
            <option key={af} value={af === "" ? "" : af}>
              {af === "" ? "— Select Affiliation —" : af}
            </option>
          ))}
        </select>

        <input
          name="status"
          value={form.status}
          onChange={onChange}
          placeholder='Status (e.g., "Published")'
          style={inputStyle}
        />

        <textarea
          name="reference"
          value={form.reference}
          onChange={onChange}
          placeholder="Reference (e.g., Ali, S., Ahmed, A., & Ahmad, S. (2025)...)"
          style={{ ...inputStyle, height: 100 }}
        />

        <input
          name="theme"
          value={form.theme}
          onChange={onChange}
          placeholder='Theme (e.g., "Educational Leadership and Policy")'
          style={inputStyle}
        />

        <div style={{ marginTop: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 18px",
              borderRadius: 6,
              border: "none",
              background: submitting ? "#90caf9" : "#1976d2",
              color: "#fff",
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Create Publication"}
          </button>
        </div>
      </form>

      {successMsg && (
        <div
          role="status"
          style={{
            marginTop: 12,
            background: "#ecf9f0",
            color: "#1b6e3a",
            padding: "10px 12px",
            borderRadius: 6,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            background: "#fff0f0",
            color: "#a00",
            padding: "10px 12px",
            borderRadius: 6,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {errorMsg}
        </div>
      )}
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
