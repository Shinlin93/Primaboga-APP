import { useEffect, useState } from "react";
import api from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}
function formatTanggal(d) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Laporan() {
  const [tab, setTab] = useState("penjualan");

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Laporan</h2>
      <p className="text-sm text-gray-500 mb-6">Laporan penjualan dan cicilan</p>

      <div className="flex gap-2 mb-6">
        {["penjualan", "cicilan"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {t === "penjualan" ? "Laporan Penjualan" : "Laporan Cicilan"}
          </button>
        ))}
      </div>

      {tab === "penjualan" ? <LaporanPenjualan /> : <LaporanCicilan />}
    </div>
  );
}

function LaporanPenjualan() {
  const [filter, setFilter] = useState({ tanggalAwal: "", tanggalAkhir: "", metode: "" });
  const [data, setData] = useState({ data: [], ringkasan: { totalTransaksi: 0, totalOmzet: 0 } });

  function cari() {
    const params = {};
    if (filter.tanggalAwal) params.tanggalAwal = filter.tanggalAwal;
    if (filter.tanggalAkhir) params.tanggalAkhir = filter.tanggalAkhir;
    if (filter.metode) params.metode = filter.metode;
    api.get("/laporan/penjualan", { params }).then((res) => setData(res.data));
  }

  useEffect(() => {
    cari();
  }, []);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500">Tanggal Awal</label>
          <input type="date" className="w-full border rounded-lg px-3 py-2 mt-1"
            value={filter.tanggalAwal} onChange={(e) => setFilter({ ...filter, tanggalAwal: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Tanggal Akhir</label>
          <input type="date" className="w-full border rounded-lg px-3 py-2 mt-1"
            value={filter.tanggalAkhir} onChange={(e) => setFilter({ ...filter, tanggalAkhir: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Metode</label>
          <select className="border rounded-lg px-3 py-2 mt-1"
            value={filter.metode} onChange={(e) => setFilter({ ...filter, metode: e.target.value })}>
            <option value="">Semua</option>
            <option value="CASH">Cash</option>
            <option value="KREDIT">Kredit</option>
          </select>
        </div>
        <button onClick={cari} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Terapkan Filter
        </button>
        <p className="text-xs text-gray-400 ml-auto">
          Export PDF/Excel: hubungkan tombol ini ke endpoint export sesuai kebutuhan cetak toko.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Transaksi</p>
          <p className="text-xl font-bold">{data.ringkasan.totalTransaksi}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Omzet</p>
          <p className="text-xl font-bold text-primary-700">{formatRupiah(data.ringkasan.totalOmzet)}</p>
        </div>
      </div>

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">No. Transaksi</th>
            <th className="text-left px-4 py-3">Tanggal</th>
            <th className="text-left px-4 py-3">Pelanggan</th>
            <th className="text-left px-4 py-3">Metode</th>
            <th className="text-left px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-4 py-3">{p.nomorTransaksi}</td>
              <td className="px-4 py-3">{formatTanggal(p.tanggal)}</td>
              <td className="px-4 py-3">{p.pelangganNama}</td>
              <td className="px-4 py-3">{p.metode === "KREDIT" ? "Kredit" : "Cash"}</td>
              <td className="px-4 py-3">{formatRupiah(p.totalHarga)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LaporanCicilan() {
  const [filter, setFilter] = useState("belum_lunas");
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/laporan/cicilan", { params: { filter } }).then((res) => setData(res.data));
  }, [filter]);

  const options = [
    { value: "belum_lunas", label: "Belum Lunas" },
    { value: "lunas", label: "Sudah Lunas" },
    { value: "jatuh_tempo_hari_ini", label: "Jatuh Tempo Hari Ini" },
    { value: "bulan_ini", label: "Bulan Ini" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === o.value ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">No. Transaksi</th>
            <th className="text-left px-4 py-3">Pelanggan</th>
            <th className="text-left px-4 py-3">Cicilan Ke</th>
            <th className="text-left px-4 py-3">Jatuh Tempo</th>
            <th className="text-left px-4 py-3">Nominal</th>
            <th className="text-left px-4 py-3">Terbayar</th>
            <th className="text-left px-4 py-3">Sisa</th>
            <th className="text-left px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t border-gray-100">
              <td className="px-4 py-3">{c.penjualan.nomorTransaksi}</td>
              <td className="px-4 py-3">{c.penjualan.pelangganNama}</td>
              <td className="px-4 py-3">{c.cicilanKe}</td>
              <td className="px-4 py-3">{formatTanggal(c.tanggalJatuhTempo)}</td>
              <td className="px-4 py-3">{formatRupiah(c.nominal)}</td>
              <td className="px-4 py-3">{formatRupiah(c.terbayar)}</td>
              <td className="px-4 py-3">{formatRupiah(c.nominal - c.terbayar)}</td>
              <td className="px-4 py-3">
                {c.status === "LUNAS" ? "Lunas" : c.status === "SEBAGIAN" ? "Sebagian" : "Belum Lunas"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
