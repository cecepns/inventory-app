export default function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
      <button
        className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Sebelumnya
      </button>
      <span className="text-sm text-slate-600">
        Hal {page} / {Math.max(totalPages, 1)}
      </span>
      <button
        className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  );
}
