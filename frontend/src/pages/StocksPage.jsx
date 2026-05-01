import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Modal from "../components/Modal";
import ModuleTable from "../components/ModuleTable";
import api from "../lib/api";

const initialForm = { item_name: "", sku: "", quantity: 0, min_stock: 0, unit: "pcs" };

export default function StocksPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [syncReplaceAll, setSyncReplaceAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const parseStockSheet = (rows) =>
    rows
      .map((raw) => {
        const normalized = Object.fromEntries(
          Object.entries(raw || {}).map(([key, value]) => [String(key).trim().toLowerCase(), value])
        );

        return {
          item_name: String(normalized.item_name || "").trim(),
          sku: String(normalized.sku || "").trim(),
          quantity: Number(normalized.quantity ?? 0),
          min_stock: Number(normalized.min_stock ?? 0),
          unit: String(normalized.unit || "pcs").trim() || "pcs",
        };
      })
      .filter((row) => row.item_name && row.sku && Number.isFinite(row.quantity) && Number.isFinite(row.min_stock))
      .map((row) => ({
        ...row,
        quantity: Math.max(0, Math.trunc(row.quantity)),
        min_stock: Math.max(0, Math.trunc(row.min_stock)),
      }));

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const normalizedRows = parseStockSheet(rows);

      if (normalizedRows.length === 0) {
        alert("File tidak valid. Pastikan kolom: item_name, sku, quantity, min_stock, unit.");
        return;
      }

      const response = await api.post("/stocks/bulk-upsert", {
        rows: normalizedRows,
        replaceAll: syncReplaceAll,
      });

      const summary = response.data?.summary;
      alert(
        `Import selesai.\n` +
          `Total: ${summary?.totalRows ?? normalizedRows.length}\n` +
          `Insert: ${summary?.inserted ?? 0}\n` +
          `Update: ${summary?.updated ?? 0}\n` +
          `Dihapus: ${summary?.removed ?? 0}`
      );
      window.location.reload();
    } catch (error) {
      alert(error?.response?.data?.message || "Gagal import Excel stock");
    } finally {
      setUploading(false);
      event.target.value = "";
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
        toolbarPlacement="below-title"
        toolbarActions={
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <a
                href="/templates/stock-import-template.xlsx"
                download
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm sm:whitespace-nowrap"
              >
                <Download size={16} />
                Download Template
              </a>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={importExcel}
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm text-white sm:whitespace-nowrap disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? "Mengunggah..." : "Upload Excel"}
              </button>
            </div>
            <label className="inline-flex items-start gap-2 text-xs leading-5 text-slate-600 sm:max-w-md sm:items-center">
              <input
                type="checkbox"
                checked={syncReplaceAll}
                onChange={(e) => setSyncReplaceAll(e.target.checked)}
                className="mt-0.5 rounded sm:mt-0"
              />
              <span>Sinkron penuh (hapus SKU yang tidak ada di file)</span>
            </label>
          </div>
        }
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
