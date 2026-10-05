import { useEffect, useState } from "react";
import api from "../api";

const emptyForm = { nama: "", alamat: "", hp: "", ktp: "", catatan: "" };

export default function Pelanggan() {
  const [pelanggan, setPelanggan] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState("");

  const load = (query = "") => api.get("/pelanggan", { params: { q: query } }).then((res) => setPelanggan(res.data));

  useEffect(() => {
    load();
  }, []);

  async function tambah(e) {
    e.preventDefault();
    await api.post("/pelanggan", form);
    setForm(emptyForm);
    load(q);
  }

  function cari(e) {
    e.preventDefault();
    load(q);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Pelanggan</h2>
      <p className="text-sm text-gray-500 mb-6">Kelola data pelanggan toko</p>

      <form onSubmit={tambah} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Nama</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>
        <div>
          <label className="text-xs text-gray-500">No. HP</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" value={form.hp}
            onChange={(e) => setForm({ ...form, hp: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Alamat</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">No. KTP (opsional)</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" value={form.ktp}
            onChange={(e) => setForm({ ...form, ktp: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Catatan</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
        </div>
        <div className="col-span-2">
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700">
            Tambah Pelanggan
          </button>
        </div>
      </form>

      <form onSubmit={cari} className="mb-4 flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1 max-w-sm"
          placeholder="Cari nama / no. HP..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">Cari</button>
      </form>

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Nama</th>
            <th className="text-left px-4 py-3">No. HP</th>
            <th className="text-left px-4 py-3">Alamat</th>
            <th className="text-left px-4 py-3">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {pelanggan.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium">{p.nama}</td>
              <td className="px-4 py-3">{p.hp || "-"}</td>
              <td className="px-4 py-3">{p.alamat || "-"}</td>
              <td className="px-4 py-3 text-gray-500">{p.catatan || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
