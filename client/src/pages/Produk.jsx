import { useEffect, useState } from "react";
import api from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

export default function Produk() {
  const [produk, setProduk] = useState([]);
  const [form, setForm] = useState({ nama: "", harga: "" });
  const [error, setError] = useState("");

  const load = () => api.get("/produk").then((res) => setProduk(res.data));

  useEffect(() => {
    load();
  }, []);

  async function tambah(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/produk", { nama: form.nama, harga: Number(form.harga) });
      setForm({ nama: "", harga: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambah produk");
    }
  }

  async function toggleStatus(p) {
    await api.put(`/produk/${p.id}`, { status: !p.status });
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Produk</h2>
      <p className="text-sm text-gray-500 mb-6">Maksimal 15 produk. Tidak ada harga kredit terpisah.</p>

      <form onSubmit={tambah} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Nama Barang</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
        </div>
        <div className="w-48">
          <label className="text-xs text-gray-500">Harga</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.harga}
            onChange={(e) => setForm({ ...form, harga: e.target.value })}
            required
          />
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700">
          Tambah
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Nama Barang</th>
            <th className="text-left px-4 py-3">Harga</th>
            <th className="text-left px-4 py-3">Cicilan (10x)</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {produk.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium">{p.nama}</td>
              <td className="px-4 py-3">{formatRupiah(p.harga)}</td>
              <td className="px-4 py-3 text-gray-500">{formatRupiah(Math.round(p.harga / 10))} x 10</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.status ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => toggleStatus(p)} className="text-primary-600 hover:underline text-xs">
                  {p.status ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
