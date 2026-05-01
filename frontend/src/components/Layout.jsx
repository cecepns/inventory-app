import { BarChart3, Boxes, Factory, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const menus = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3, feature: "dashboard" },
  { to: "/stocks", label: "Kontrol Stock", icon: Boxes, feature: "stock" },
  { to: "/planning", label: "Planning Produksi", icon: Factory, feature: "planning" },
  { to: "/monitoring", label: "Monitoring Produksi", icon: ShieldCheck, feature: "monitoring" },
  { to: "/users", label: "Manajemen User", icon: Users, feature: "users" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout, canAccess } = useAuth();

  const availableMenus = menus.filter((menu) => canAccess(menu.feature));
  if (!availableMenus.some((m) => pathname.startsWith(m.to))) {
    return <Navigate to={availableMenus[0]?.to || "/login"} replace />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Inventory App Logo" className="h-8 w-8 rounded-lg object-cover" />
          <h1 className="font-bold text-brand-700">Inventory App</h1>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <div className="relative flex w-full overflow-x-hidden">
        {open ? (
          <button
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar overlay"
          />
        ) : null}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 min-h-screen p-4 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <img src={logo} alt="Inventory App Logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
              <p className="text-xs text-slate-300">Inventory Produksi</p>
            </div>
          </div>
          <nav className="space-y-2">
            {availableMenus.map((menu) => {
              const Icon = menu.icon;
              const active = pathname.startsWith(menu.to);
              return (
                <Link
                  key={menu.to}
                  to={menu.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                    active ? "bg-brand-500 text-white" : "hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  <span>{menu.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-10 rounded-lg bg-slate-800 p-3 text-sm">
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-slate-300">{user?.role}</p>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg bg-rose-500 px-3 py-2 text-white flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>
        <main className="w-full min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
