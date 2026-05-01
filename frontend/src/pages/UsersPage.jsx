import { useState } from "react";
import Modal from "../components/Modal";
import ModuleTable from "../components/ModuleTable";
import api from "../lib/api";

const featureOptions = ["stock", "planning", "monitoring", "dashboard", "users"];
const initialForm = { username: "", full_name: "", password: "", role: "user", features: ["dashboard"] };

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async (params) => (await api.get("/users", { params })).data;
  const save = async (e) => {
    e.preventDefault();
    if (editId) await api.put(`/users/${editId}`, form);
    else await api.post("/users", form);
    setOpen(false);
    window.location.reload();
  };

  const toggleFeature = (feature) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  return (
    <>
      <ModuleTable
        title="Manajemen User & Hak Akses"
        columns={["username", "full_name", "role", "features"]}
        fetchData={fetchData}
        renderCell={(column, row) => {
          if (column === "features") return (row.features || []).join(", ");
          return row[column];
        }}
        onAdd={() => {
          setEditId(null);
          setForm(initialForm);
          setOpen(true);
        }}
        onEdit={(row) => {
          setEditId(row.id);
          setForm({ ...row, password: "", features: row.features || [] });
          setOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm("Hapus user ini?")) {
            await api.delete(`/users/${id}`);
            window.location.reload();
          }
        }}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit User" : "Tambah User"}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div><label className="text-sm font-medium">Username</label><input className="mt-1 w-full rounded border px-3 py-2" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Nama Lengkap</label><input className="mt-1 w-full rounded border px-3 py-2" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Password {editId ? "(kosongkan jika tidak ganti)" : ""}</label><input type="password" className="mt-1 w-full rounded border px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} /></div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Allow Feature</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {featureOptions.map((feature) => (
                <label key={feature} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <input type="checkbox" checked={form.features.includes(feature)} onChange={() => toggleFeature(feature)} />
                  {feature}
                </label>
              ))}
            </div>
          </div>
          <button className="sm:col-span-2 rounded bg-brand-500 py-2 text-white">Simpan</button>
        </form>
      </Modal>
    </>
  );
}
