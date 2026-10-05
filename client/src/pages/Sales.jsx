import { useEffect, useState } from "react";
import api from "../api";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ nama: "", hp: "" });

  const load = () => api.get("/sales").then((res) => setSales(res.data));

  useEffect(() => {
    load();
  }, []);

  async function tambah(e) {
    e.preventDefault();
    await api.post("/sales", form);
    setForm({ nama: "", hp: "" });
    load();
  }

  async function toggleStatus(s) {
    await api.put(`/sales/${s.id}`, { status: !s.status });
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Sales</h2>
      <p className="text-sm text-gray-500 mb-6">Kelola data tim sales toko</p>

      <form onSubmit={tambah} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Nama Sales</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
        </div>
        <div className="w-56">
          <label className="text-xs text-gray-500">Nomor HP</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.hp}
            onChange={(e) => setForm({ ...form, hp: e.target.value })}
          />
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700">
          Tambah
        </button>
      </form>

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Nama</th>
            <th className="text-left px-4 py-3">No. HP</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium">{s.nama}</td>
              <td className="px-4 py-3">{s.hp || "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.status ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => toggleStatus(s)} className="text-primary-600 hover:underline text-xs">
                  {s.status ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
