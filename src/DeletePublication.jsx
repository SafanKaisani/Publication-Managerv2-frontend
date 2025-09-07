// DeletePublication.jsx
import React, { useState } from "react";

export default function DeletePublication() {
  const [pubId, setPubId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // <<-- DEV CONFIG: change if needed; consider using import.meta.env for production -->> 
  const BASE_URL = "http://127.0.0.1:8000";
  const USERNAME = "admin";
  const PASSWORD = "supersecretpassword";
  // <<-- end config -->> 

  const handleDelete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const id = String(pubId || "").trim();
    if (!id) {
      setErrorMsg("⚠️ Please enter a Publication ID first.");
      return;
    }

    const ok = window.confirm(`Are you sure you want to DELETE publication id ${id}? This action cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const url = `${BASE_URL}/delete-publication/${encodeURIComponent(id)}`;
      const basic = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: basic,
        },
      });

      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || JSON.stringify(j);
        } catch {}
        throw new Error(msg);
      }

      // backend returns { message: "Deleted", "id": pub_id }
      const json = await res.json().catch(() => null);
      const idReturned = json?.id ?? id;
      setSuccessMsg(`✅ Publication with ID ${idReturned} deleted.`);
      setPubId("");
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMsg(err.message || "Failed to delete publication");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Delete Publication</h2>
      <p style={{ color: "#555" }}>Enter the Publication ID you want to delete.</p>

      <form onSubmit={handleDelete} style={{ maxWidth: 420 }}>
        <input
          type="text"
          value={pubId}
          onChange={(e) => {
            setPubId(e.target.value);
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          placeholder="Publication ID (e.g., 123)"
          style={{
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
            fontStyle: "italic",
          }}
        />

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={deleting}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: deleting ? "#f28b8b" : "#c62828",
              color: "#fff",
              cursor: deleting ? "default" : "pointer",
              fontWeight: 700,
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <div style={{ color: "#666", fontSize: 14 }}>
            {successMsg ? "Deleted" : !errorMsg ? "" : ""}
          </div>
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
