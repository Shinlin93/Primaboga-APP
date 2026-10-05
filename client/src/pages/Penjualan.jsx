import { useEffect, useState } from "react";
import api, { downloadFile } from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

export default function Penjualan() {
  const [produkList, setProdukList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);

  const [pelangganId, setPelangganId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [metode, setMetode] = useState("CASH");
  const [cart, setCart] = useState([]); // [{produkId, nama, harga, qty}]
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState(null); // transaksi yang baru dibuat

  useEffect(() => {
    api.get("/produk", { params: { status: "aktif" } }).then((res) => setProdukList(res.data));
    api.get("/sales", { params: { status: "aktif" } }).then((res) => setSalesList(res.data));
    api.get("/pelanggan").then((res) => setPelangganList(res.data));
  }, []);

  function tambahKeCart(produkId) {
    const produk = produkList.find((p) => p.id === Number(produkId));
    if (!produk) return;
    setCart((prev) => {
      const existing = prev.find((it) => it.produkId === produk.id);
      if (existing) {
        return prev.map((it) => (it.produkId === produk.id ? { ...it, qty: it.qty + 1 } : it));
      }
      return [...prev, { produkId: produk.id, nama: produk.nama, harga: produk.harga, qty: 1 }];
    });
  }

  function ubahQty(produkId, qty) {
    setCart((prev) => prev.map((it) => (it.produkId === produkId ? { ...it, qty: Math.max(1, Number(qty)) } : it)));
  }

  function hapusItem(produkId) {
    setCart((prev) => prev.filter((it) => it.produkId !== produkId));
  }

  const total = cart.reduce((sum, it) => sum + it.harga * it.qty, 0);
  const nominalCicilan = Math.round(total / 10);

  async function simpanTransaksi(e) {
    e.preventDefault();
    setError("");
    if (!pelangganId || !salesId || cart.length === 0) {
      setError("Pelanggan, sales, dan minimal 1 barang wajib diisi");
      return;
    }
    try {
      const res = await api.post("/penjualan", {
        pelangganId: Number(pelangganId),
        salesId: Number(salesId),
        metode,
        items: cart.map((it) => ({ produkId: it.produkId, qty: it.qty })),
      });
      setHasil(res.data);
      setCart([]);
      setPelangganId("");
      setSalesId("");
      setMetode("CASH");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan transaksi");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Penjualan</h2>
      <p className="text-sm text-gray-500 mb-6">Buat transaksi baru — Cash atau Kredit</p>

      {hasil && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800">
              Transaksi {hasil.nomorTransaksi} berhasil disimpan ✅
            </p>
            <p className="text-sm text-green-700">
              Total {formatRupiah(hasil.totalHarga)} — {hasil.metode === "KREDIT" ? "Kredit 10x" : "Cash"}
            </p>
          </div>
          <button
            onClick={() => downloadFile(`/penjualan/${hasil.id}/struk`, `Struk_${hasil.nomorTransaksi}.docx`)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Cetak Struk (Word)
          </button>
        </div>
      )}

      <form onSubmit={simpanTransaksi} className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Barang</h3>
          <select
            className="w-full border rounded-lg px-3 py-2 mb-3"
            onChange={(e) => e.target.value && tambahKeCart(e.target.value)}
            value=""
          >
            <option value="">+ Tambah barang...</option>
            {produkList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} — {formatRupiah(p.harga)}
              </option>
            ))}
          </select>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Belum ada barang dipilih</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left py-2">Barang</th>
                  <th className="text-left py-2 w-20">Qty</th>
                  <th className="text-right py-2 w-32">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((it) => (
                  <tr key={it.produkId} className="border-t border-gray-100">
                    <td className="py-2">{it.nama}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => ubahQty(it.produkId, e.target.value)}
                        className="w-16 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2 text-right">{formatRupiah(it.harga * it.qty)}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => hapusItem(it.produkId)} className="text-red-500 text-xs">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 h-fit">
          <h3 className="font-semibold mb-3">Detail Transaksi</h3>

          <label className="text-xs text-gray-500">Pelanggan</label>
          <select
            className="w-full border rounded-lg px-3 py-2 mt-1 mb-3"
            value={pelangganId}
            onChange={(e) => setPelangganId(e.target.value)}
          >
            <option value="">Pilih pelanggan...</option>
            {pelangganList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>

          <label className="text-xs text-gray-500">Sales</label>
          <select
            className="w-full border rounded-lg px-3 py-2 mt-1 mb-3"
            value={salesId}
            onChange={(e) => setSalesId(e.target.value)}
          >
            <option value="">Pilih sales...</option>
            {salesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>

          <label className="text-xs text-gray-500">Metode Pembayaran</label>
          <div className="flex gap-2 mt-1 mb-3">
            {["CASH", "KREDIT"].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMetode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  metode === m ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600"
                }`}
              >
                {m === "CASH" ? "Cash" : "Kredit"}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Total Harga</span>
              <span className="font-semibold">{formatRupiah(total)}</span>
            </div>
            {metode === "KREDIT" && total > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Cicilan</span>
                <span>{formatRupiah(nominalCicilan)} x 10 bulan</span>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

          <button className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium mt-4 hover:bg-primary-700">
            Simpan Transaksi
          </button>
        </div>
      </form>
    </div>
  );
}
