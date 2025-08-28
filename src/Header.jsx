import React from "react";
import { BsJustify, BsPersonCircle } from "react-icons/bs";

function Header({ toggleSidebar }) {
  return (
    <header className="header">
      <div className="menu-icon" onClick={toggleSidebar} style={{ cursor: "pointer" }}>
        <BsJustify size={22} />
      </div>

      <div className="header-title">Publication Manager</div>

      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#fff",
          color: "#004b87",
          border: "none",
          padding: "6px 12px",
          borderRadius: "20px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <BsPersonCircle size={20} />
        Account
      </button>
    </header>
  );
}

export default Header;
