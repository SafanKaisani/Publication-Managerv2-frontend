import React from "react";
import { Link } from "react-router-dom";
import {
  BsHouse,
  BsFilePlus,
  BsGear,
  BsBook,
  BsSearch,
  BsPencilSquare,
  BsTrash,
  BsClockHistory,
} from "react-icons/bs";
import {
  FiDownload,
  FiPlusSquare,
  FiFileText,
  FiFilter,
  FiBarChart2,
  FiTrendingUp,
} from "react-icons/fi";

function Sidebar({ sidebarOpen }) {
  return (
    <aside
      className={sidebarOpen ? "open" : ""}
      style={{
        overflowY: "auto", // enables vertical scroll
        height: "100vh",   // full viewport height
        padding: "10px",   // optional padding
      }}
    >
      <Link to="/" className="sidebar-item">
        <BsHouse size={20} />
        {sidebarOpen && <span>Home</span>}
      </Link>

      <Link to="/add-publication" className="sidebar-item">
        <BsFilePlus size={20} />
        {sidebarOpen && <span>Add Publication</span>}
      </Link>

      <Link to="/create-publication" className="sidebar-item">
        <FiPlusSquare size={20} />
        {sidebarOpen && <span>Create Publication</span>}
      </Link>

      <Link to="/publications" className="sidebar-item">
        <BsBook size={20} />
        {sidebarOpen && <span>Publications List</span>}
      </Link>

      <Link to="/search-publications" className="sidebar-item">
        <BsSearch size={20} />
        {sidebarOpen && <span>Search Publications</span>}
      </Link>

      <Link to="/update-publication" className="sidebar-item">
        <BsPencilSquare size={20} />
        {sidebarOpen && <span>Update Publication</span>}
      </Link>

      <Link to="/delete-publication" className="sidebar-item">
        <BsTrash size={20} />
        {sidebarOpen && <span>Delete Publication</span>}
      </Link>

      <Link to="/history" className="sidebar-item">
        <BsClockHistory size={20} />
        {sidebarOpen && <span>History</span>}
      </Link>

      <Link to="/export-publication" className="sidebar-item">
        <FiDownload size={20} />
        {sidebarOpen && <span>Export Publication</span>}
      </Link>

      <Link to="/export-filtered-excel" className="sidebar-item">
        <FiFilter size={20} />
        {sidebarOpen && <span>Export Filtered Excel</span>}
      </Link>

      <Link to="/export-pdf" className="sidebar-item">
        <FiFileText size={20} />
        {sidebarOpen && <span>Export PDF</span>}
      </Link>

      <Link to="/faculty-stats" className="sidebar-item">
        <FiBarChart2 size={20} />
        {sidebarOpen && <span>Faculty Stats</span>}
      </Link>

      <Link to="/yearly-stats" className="sidebar-item">
        <FiTrendingUp size={20} />
        {sidebarOpen && <span>Yearly Stats</span>}
      </Link>

      <Link to="/settings" className="sidebar-item">
        <BsGear size={20} />
        {sidebarOpen && <span>Settings</span>}
      </Link>
    </aside>
  );
}

export default Sidebar;