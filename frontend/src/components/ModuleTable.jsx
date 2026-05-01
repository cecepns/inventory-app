import { Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import Pagination from "./Pagination";

export default function ModuleTable({
  title,
  columns,
  fetchData,
  onAdd,
  onEdit,
  onDelete,
  renderCell,
  toolbarActions,
  toolbarPlacement = "inline",
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const run = async () => {
      const response = await fetchData({ page, search: debouncedSearch });
      setRows(response.data || []);
      setMeta(response.meta || { page: 1, totalPages: 1 });
    };
    run();
  }, [page, debouncedSearch, fetchData]);

  return (
    <div className="w-full max-w-full rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          {toolbarPlacement === "below-title" ? (
            <div className="w-full sm:w-auto">{toolbarActions}</div>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {toolbarActions}
            </div>
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm sm:w-56"
              />
            </div>
            <button
              onClick={onAdd}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm text-white sm:whitespace-nowrap"
            >
              + Tambah
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-semibold text-slate-700">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2">
                    {renderCell ? renderCell(c, row) : row[c]}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button className="rounded border p-2" onClick={() => onEdit(row)}>
                      <Pencil size={14} />
                    </button>
                    <button className="rounded border p-2 text-rose-500" onClick={() => onDelete(row.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length + 1}>
                  Data belum tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onChange={setPage} />
    </div>
  );
}
