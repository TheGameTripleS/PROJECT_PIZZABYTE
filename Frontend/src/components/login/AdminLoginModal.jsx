import React, { useState } from "react";

const AdminLoginModal = ({ setIsAdmin, close }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    
    // Pulling from your .env file
    const EXPECTED_USER = import.meta.env.VITE_ADMIN_USERNAME;
    const EXPECTED_PASS = import.meta.env.VITE_ADMIN_PASSWORD;

    if (credentials.username === EXPECTED_USER && credentials.password === EXPECTED_PASS) {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("loggedIn", "true");
      close();
    } else {
      setError("Invalid Admin Credentials");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-modal">
        <h2>Admin Access</h2>
        <form onSubmit={handleAdminSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Admin Username"
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Admin Password"
            onChange={handleChange}
            className="input-field"
            required
          />
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn-primary">Login to Dashboard</button>
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;