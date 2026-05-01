import { useState } from "react";
import Modal from "../components/Modal";
import ModuleTable from "../components/ModuleTable";
import api from "../lib/api";

const initialForm = { product_name: "", target_quantity: 0, planned_date: "", status: "draft", notes: "" };

export default function PlanningPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async (params) => (await api.get("/production-plans", { params })).data;
  const save = async (e) => {
    e.preventDefault();
    if (editId) await api.put(`/production-plans/${editId}`, form);
    else await api.post("/production-plans", form);
    setOpen(false);
    window.location.reload();
  };

  return (
    <>
      <ModuleTable
        title="Planning / Perencanaan Produksi"
        columns={["product_name", "target_quantity", "planned_date", "status", "notes"]}
        fetchData={fetchData}
        onAdd={() => {
          setEditId(null);
          setForm(initialForm);
          setOpen(true);
        }}
        onEdit={(row) => {
          setEditId(row.id);
          setForm({ ...row, planned_date: row.planned_date?.slice(0, 10) });
          setOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm("Hapus data ini?")) {
            await api.delete(`/production-plans/${id}`);
            window.location.reload();
          }
        }}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Planning" : "Tambah Planning"}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div>
            <label className="text-sm font-medium">Nama Produk</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Target Quantity</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.target_quantity} onChange={(e) => setForm({ ...form, target_quantity: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal Produksi</label>
            <input type="date" className="mt-1 w-full rounded border px-3 py-2" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Catatan</label>
            <textarea className="mt-1 w-full rounded border px-3 py-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="sm:col-span-2 rounded bg-brand-500 py-2 text-white">Simpan</button>
        </form>
      </Modal>
    </>
  );
}
