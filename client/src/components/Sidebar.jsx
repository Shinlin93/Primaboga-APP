import { NavLink } from "react-router-dom";

const menu = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/penjualan", label: "Penjualan", icon: "🧾" },
  { to: "/pembayaran-cicilan", label: "Pembayaran Cicilan", icon: "💵" },
  { to: "/produk", label: "Produk", icon: "📦" },
  { to: "/pelanggan", label: "Pelanggan", icon: "👥" },
  { to: "/sales", label: "Sales", icon: "🧑‍💼" },
  { to: "/laporan", label: "Laporan", icon: "📊" },
  { to: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-primary-700 leading-tight">PRIMABOGA</h1>
        <p className="text-xs text-gray-500 tracking-wide">COOKWARE</p>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-400">
        Sistem Penjualan v1.0
      </div>
    </aside>
  );
}
