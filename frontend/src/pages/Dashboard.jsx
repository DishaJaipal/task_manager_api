import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const getRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showingAll, setShowingAll] = useState(false); // ← tracks admin view
  const navigate = useNavigate();

  const role = getRoleFromToken();   // ← "admin" or "user"
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/api/v1/tasks/");
      setTasks(res.data);
      setShowingAll(false);
    } catch {
      setError("Failed to load tasks");
    }
  };

  // Admin only
  const fetchAllTasks = async () => {
    try {
      const res = await api.get("/api/v1/tasks/all");
      setTasks(res.data);
      setShowingAll(true);
      setSuccess(`Showing all ${res.data.length} tasks in the system`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch all tasks");
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/api/v1/tasks/", form);
      setForm({ title: "", description: "" });
      setSuccess("Task created!");
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await api.put(`/api/v1/tasks/${task.id}`, {
        is_completed: !task.is_completed,
      });
      fetchTasks();
    } catch {
      setError("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/api/v1/tasks/${id}`);
      setSuccess("Task deleted");
      fetchTasks();
    } catch {
      setError("Failed to delete task");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="dashboard-wrapper">

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2>{showingAll ? "All Tasks (Admin)" : "My Tasks"}</h2>
            {isAdmin && (
              <span style={{ fontSize: "0.8rem", color: "#e94560" }}>
                Admin
              </span>
            )}
          </div>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
            <button
              className="btn-small btn-done"
              onClick={fetchAllTasks}
              disabled={showingAll}
            >
              View All Tasks
            </button>
            <button
              className="btn-small btn-undo"
              onClick={fetchTasks}
              disabled={!showingAll}
            >
              View My Tasks
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Create Task Form */}
        <form className="task-form" onSubmit={createTask}>
          <input className="input" placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required />
          <input className="input" placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>

        {/* Task List */}
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div>
                <p className={`task-title ${task.is_completed ? "done" : ""}`}>
                  {task.title}
                  {/* Admin view shows which user owns the task */}
                  {showingAll && (
                    <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: "8px" }}>
                      (user #{task.owner_id})
                    </span>
                  )}
                </p>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
              </div>
              <div className="task-actions">
                <button
                  className={`btn-small ${task.is_completed ? "btn-undo" : "btn-done"}`}
                  onClick={() => toggleComplete(task)}
                >
                  {task.is_completed ? "Undo" : "Done"}
                </button>
                <button
                  className="btn-small btn-delete"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
