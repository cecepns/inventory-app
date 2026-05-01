export default function StatCard({ title, value, subtitle, icon }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <Icon className="text-brand-500" size={20} />
      </div>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
