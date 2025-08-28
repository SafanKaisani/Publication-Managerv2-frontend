function GetPublications() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>📚 Publications List</h2>

      <div
        style={{
          minHeight: "400px", // 👈 big area
          width: "100%",
          border: "2px solid #ccc",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {/* Later we will insert publication JSON here */}
        <p>Publications will appear here...</p>
      </div>
    </div>
  );
}

export default GetPublications;
