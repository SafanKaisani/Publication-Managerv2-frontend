import React from "react";

function Home() {
  return (
    <div className="home-container">
      <div className="welcome-card">
        <h1>Welcome to Publication Manager</h1>
        <p>Manage, track, and organize your publications in one place.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>12</h2>
          <p>Total Publications</p>
        </div>
        <div className="stat-card">
          <h2>3</h2>
          <p>Pending Approvals</p>
        </div>
        <div className="stat-card">
          <h2>5</h2>
          <p>Drafts</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
