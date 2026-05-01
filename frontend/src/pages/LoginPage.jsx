import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-center">
          <img src={logo} alt="Inventory App Logo" className="h-20 w-20 rounded-2xl object-cover shadow" />
        </div>
        <h1 className="text-2xl font-bold">Login Inventory</h1>
        <p className="text-sm text-slate-500">Masuk untuk akses dashboard produksi.</p>
        {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-sm text-rose-600">{error}</p> : null}

        <label className="mt-4 block text-sm font-medium">Username</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.username}
          onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
        />

        <label className="mt-4 block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />

        <button disabled={loading} className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-70">
          {loading ? "Loading..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
