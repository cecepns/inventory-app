import { useState } from "react";
import Modal from "../components/Modal";
import ModuleTable from "../components/ModuleTable";
import api from "../lib/api";

const initialForm = { item_name: "", sku: "", quantity: 0, min_stock: 0, unit: "pcs" };

export default function StocksPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async (params) => (await api.get("/stocks", { params })).data;

  const save = async (e) => {
    e.preventDefault();
    if (editId) await api.put(`/stocks/${editId}`, form);
    else await api.post("/stocks", form);
    setOpen(false);
    window.location.reload();
  };

  const remove = async (id) => {
    if (confirm("Hapus data ini?")) {
      await api.delete(`/stocks/${id}`);
      window.location.reload();
    }
  };

  return (
    <>
      <ModuleTable
        title="Kontrol Stock"
        columns={["item_name", "sku", "quantity", "min_stock", "unit"]}
        fetchData={fetchData}
        onAdd={() => {
          setEditId(null);
          setForm(initialForm);
          setOpen(true);
        }}
        onEdit={(row) => {
          setEditId(row.id);
          setForm(row);
          setOpen(true);
        }}
        onDelete={remove}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Stock" : "Tambah Stock"}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div>
            <label className="text-sm font-medium">Nama Item</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Minimum Stock</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Satuan</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          </div>
          <button className="sm:col-span-2 rounded bg-brand-500 py-2 text-white">Simpan</button>
        </form>
      </Modal>
    </>
  );
}
