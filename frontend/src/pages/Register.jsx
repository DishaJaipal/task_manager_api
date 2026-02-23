import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", form);
      setSuccess("Registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="container">
    <div className="card">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <input className="input" type="email" placeholder="Email"
          value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
        <input className="input" type="password" placeholder="Password"
          value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
        <select className="input" value={form.role}
          onChange={(e) => setForm({...form, role: e.target.value})}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{marginTop: "1rem"}}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  </div>
);
}
