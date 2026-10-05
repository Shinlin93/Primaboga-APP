import { useEffect, useState } from "react";
import api from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

function Card({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || "text-gray-800"}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Memuat dashboard...</p>;
  if (!data) return <p className="text-red-500">Gagal memuat data dashboard.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">Ringkasan performa toko hari ini</p>

      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Hari Ini</h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card label="Penjualan Cash" value={data.hariIni.jumlahPenjualanCash} />
        <Card label="Penjualan Kredit" value={data.hariIni.jumlahPenjualanKredit} />
        <Card
          label="Omzet Hari Ini"
          value={formatRupiah(data.hariIni.omzetHariIni)}
          accent="text-primary-700"
        />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Keseluruhan</h3>
      <div className="grid grid-cols-4 gap-4">
        <Card label="Total Piutang" value={formatRupiah(data.keseluruhan.totalPiutang)} />
        <Card label="Cicilan Belum Lunas" value={data.keseluruhan.totalCicilanBelumLunas} />
        <Card label="Total Pelanggan" value={data.keseluruhan.totalPelanggan} />
        <Card label="Total Sales" value={data.keseluruhan.totalSales} />
      </div>
    </div>
  );
}
