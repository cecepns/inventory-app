import { Activity, AlertTriangle, Boxes, ClipboardList, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import api from "../lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    stockTotal: 0,
    lowStockTotal: 0,
    planningTotal: 0,
    monitoringTotal: 0,
    efficiency: 0,
  });

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard Analisis & Pelaporan</h1>
      <p className="text-slate-500 mb-4">Pantau kinerja inventori dan produksi secara realtime.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Stock" value={summary.stockTotal} subtitle="Seluruh item aktif" icon={Boxes} />
        <StatCard title="Low Stock" value={summary.lowStockTotal} subtitle="Butuh restock" icon={AlertTriangle} />
        <StatCard title="Planning" value={summary.planningTotal} subtitle="Rencana produksi" icon={ClipboardList} />
        <StatCard title="Monitoring" value={summary.monitoringTotal} subtitle="Data monitoring mesin" icon={Activity} />
        <StatCard title="Efisiensi" value={`${summary.efficiency}%`} subtitle="Rasio aktual/target output" icon={Gauge} />
      </div>
    </div>
  );
}
