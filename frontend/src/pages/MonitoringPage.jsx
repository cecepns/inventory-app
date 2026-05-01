import { useState } from "react";
import Modal from "../components/Modal";
import ModuleTable from "../components/ModuleTable";
import api from "../lib/api";

const initialForm = {
  machine_name: "",
  operator_name: "",
  shift_name: "A",
  target_output: 0,
  actual_output: 0,
  downtime_minutes: 0,
  monitored_at: "",
};

export default function MonitoringPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async (params) => (await api.get("/production-monitoring", { params })).data;
  const save = async (e) => {
    e.preventDefault();
    if (editId) await api.put(`/production-monitoring/${editId}`, form);
    else await api.post("/production-monitoring", form);
    setOpen(false);
    window.location.reload();
  };

  return (
    <>
      <ModuleTable
        title="Monitoring Produksi (Efisiensi)"
        columns={["machine_name", "operator_name", "shift_name", "target_output", "actual_output", "downtime_minutes", "monitored_at"]}
        fetchData={fetchData}
        onAdd={() => {
          setEditId(null);
          setForm(initialForm);
          setOpen(true);
        }}
        onEdit={(row) => {
          setEditId(row.id);
          setForm({ ...row, monitored_at: row.monitored_at?.slice(0, 10) });
          setOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm("Hapus data ini?")) {
            await api.delete(`/production-monitoring/${id}`);
            window.location.reload();
          }
        }}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Monitoring" : "Tambah Monitoring"}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <div><label className="text-sm font-medium">Mesin</label><input className="mt-1 w-full rounded border px-3 py-2" value={form.machine_name} onChange={(e) => setForm({ ...form, machine_name: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Operator</label><input className="mt-1 w-full rounded border px-3 py-2" value={form.operator_name} onChange={(e) => setForm({ ...form, operator_name: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Shift</label><input className="mt-1 w-full rounded border px-3 py-2" value={form.shift_name} onChange={(e) => setForm({ ...form, shift_name: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Target Output</label><input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.target_output} onChange={(e) => setForm({ ...form, target_output: Number(e.target.value) })} required /></div>
          <div><label className="text-sm font-medium">Actual Output</label><input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.actual_output} onChange={(e) => setForm({ ...form, actual_output: Number(e.target.value) })} required /></div>
          <div><label className="text-sm font-medium">Downtime (menit)</label><input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.downtime_minutes} onChange={(e) => setForm({ ...form, downtime_minutes: Number(e.target.value) })} required /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium">Tanggal Monitoring</label><input type="date" className="mt-1 w-full rounded border px-3 py-2" value={form.monitored_at} onChange={(e) => setForm({ ...form, monitored_at: e.target.value })} required /></div>
          <button className="sm:col-span-2 rounded bg-brand-500 py-2 text-white">Simpan</button>
        </form>
      </Modal>
    </>
  );
}
