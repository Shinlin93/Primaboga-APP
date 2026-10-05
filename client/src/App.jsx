import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Penjualan from "./pages/Penjualan";
import PembayaranCicilan from "./pages/PembayaranCicilan";
import Produk from "./pages/Produk";
import Pelanggan from "./pages/Pelanggan";
import Sales from "./pages/Sales";
import Laporan from "./pages/Laporan";
import Pengaturan from "./pages/Pengaturan";

export default function App() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/penjualan" element={<Penjualan />} />
          <Route path="/pembayaran-cicilan" element={<PembayaranCicilan />} />
          <Route path="/produk" element={<Produk />} />
          <Route path="/pelanggan" element={<Pelanggan />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/laporan" element={<Laporan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
        </Routes>
      </main>
    </div>
  );
}
