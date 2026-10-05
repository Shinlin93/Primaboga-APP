import { useEffect, useState } from "react";
import api, { downloadFile } from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}
function formatTanggal(d) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PembayaranCicilan() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = (query = "") => {
    setLoading(true);
    api
      .get("/cicilan", { params: { q: query } })
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  function cari(e) {
    e.preventDefault();
    load(q);
  }

  async function bayar(row) {
    if (!confirm(`Konfirmasi pembayaran cicilan ke-${row.cicilanKe} untuk ${row.pelangganNama}?`)) return;
    await api.put(`/cicilan/${row.id}/bayar`);
    await load(q);
    if (confirm("Pembayaran tersimpan. Cetak bukti pembayaran (Word)?")) {
      downloadFile(`/cicilan/${row.id}/bukti`, `Cicilan_${row.nomorTransaksi}_${row.cicilanKe}.docx`);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Pembayaran Cicilan</h2>
      <p className="text-sm text-gray-500 mb-6">Cari berdasarkan nama pelanggan, no. HP, atau nomor transaksi</p>

      <form onSubmit={cari} className="mb-4 flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1 max-w-md"
          placeholder="Cari nama pelanggan / no. HP / TRX..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Cari</button>
      </form>

      <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Pelanggan</th>
            <th className="text-left px-4 py-3">Barang</th>
            <th className="text-left px-4 py-3">Sales</th>
            <th className="text-left px-4 py-3">Cicilan Ke</th>
            <th className="text-left px-4 py-3">Jatuh Tempo</th>
            <th className="text-left px-4 py-3">Nominal</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={8} className="text-center py-6 text-gray-400">Memuat...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-6 text-gray-400">Tidak ada data</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium">{r.pelangganNama}</td>
              <td className="px-4 py-3">{r.barang}</td>
              <td className="px-4 py-3">{r.salesNama}</td>
              <td className="px-4 py-3">{r.cicilanKe} / {r.totalCicilan}</td>
              <td className="px-4 py-3">{formatTanggal(r.tanggalJatuhTempo)}</td>
              <td className="px-4 py-3">{formatRupiah(r.nominal)}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "LUNAS" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.status === "LUNAS" ? "Lunas" : "Belum Lunas"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === "LUNAS" ? (
                  <button
                    onClick={() => downloadFile(`/cicilan/${r.id}/bukti`, `Cicilan_${r.nomorTransaksi}_${r.cicilanKe}.docx`)}
                    className="text-primary-600 hover:underline text-xs"
                  >
                    Cetak Ulang
                  </button>
                ) : (
                  <button
                    onClick={() => bayar(r)}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700"
                  >
                    Bayar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
