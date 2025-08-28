import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Home from "./Home";
import AddPublication from "./AddPublication";
import Settings from "./Settings";
import "./App.css";
import GetPublications from "./GetPublications";
import SearchPublications from "./SearchPublications";
import UpdatePublication from "./UpdatePublication";
import DeletePublication from "./DeletePublication";
import History from "./History";
import ExportPublication from "./ExportPublication";
import CreatePublication from "./CreatePublication";
import ExportPDF from "./ExportPDF";
import ExportFilteredExcel from "./ExportFilteredExcel";
import FacultyStats from "./FacultyStats";
import YearlyStats from "./YearlyStats";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Router>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar sidebarOpen={sidebarOpen} />

      <main className={`content ${sidebarOpen ? "shifted" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-publication" element={<AddPublication />} />
          <Route path="/create-publication" element={<CreatePublication />} />
          <Route path="/publications" element={<GetPublications />} />
          <Route path="/search-publications" element={<SearchPublications />} />
          <Route path="/update-publication" element={<UpdatePublication />} />
          <Route path="/delete-publication" element={<DeletePublication />} />
          <Route path="/history" element={<History />} />
          <Route path="/export-publication" element={<ExportPublication />} />
          <Route path="/export-filtered-excel" element={<ExportFilteredExcel />} />
          <Route path="/export-pdf" element={<ExportPDF />} />
          <Route path="/faculty-stats" element={<FacultyStats />} />
          <Route path="/yearly-stats" element={<YearlyStats />} />
          <Route path="/settings" element={<Settings />} />
          
        </Routes>
      </main>
    </Router>
  );
}

export default App;
