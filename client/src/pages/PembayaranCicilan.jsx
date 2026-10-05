import { useEffect, useState } from "react";
import api, { downloadFile } from "../api";

function formatRupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}
function formatTanggal(d) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

const STATUS = {
  LUNAS: { label: "Lunas", cls: "bg-green-100 text-green-700" },
  SEBAGIAN: { label: "Sebagian", cls: "bg-blue-100 text-blue-700" },
  BELUM_LUNAS: { label: "Belum Lunas", cls: "bg-amber-100 text-amber-700" },
};

function cetakBukti(pembayaranId, nomorTransaksi) {
  return downloadFile(
    `/cicilan/pembayaran/${pembayaranId}/bukti`,
    `Bukti_${nomorTransaksi}_${pembayaranId}.docx`
  );
}

export default function PembayaranCicilan() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalRow, setModalRow] = useState(null);

  const load = (query = "") => {
    setLoading(true);
    return api
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
            <th className="text-left px-4 py-3">Terbayar</th>
            <th className="text-left px-4 py-3">Sisa</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={10} className="text-center py-6 text-gray-400">Memuat...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center py-6 text-gray-400">Tidak ada data</td>
            </tr>
          )}
          {rows.map((r) => {
            const st = STATUS[r.status] || STATUS.BELUM_LUNAS;
            const dibatalkan = r.penjualanStatus === "DIBATALKAN";
            return (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">
                  {r.pelangganNama}
                  {dibatalkan && <span className="ml-2 text-xs text-red-500">(dibatalkan)</span>}
                </td>
                <td className="px-4 py-3">{r.barang}</td>
                <td className="px-4 py-3">{r.salesNama}</td>
                <td className="px-4 py-3">{r.cicilanKe} / {r.totalCicilan}</td>
                <td className="px-4 py-3">{formatTanggal(r.tanggalJatuhTempo)}</td>
                <td className="px-4 py-3">{formatRupiah(r.nominal)}</td>
                <td className="px-4 py-3">{formatRupiah(r.terbayar)}</td>
                <td className="px-4 py-3">{formatRupiah(r.sisa)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setModalRow(r)}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700"
                  >
                    {r.status === "LUNAS" || dibatalkan ? "Riwayat" : "Bayar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalRow && (
        <BayarModal
          row={modalRow}
          onClose={() => setModalRow(null)}
          onSaved={() => load(q)}
        />
      )}
    </div>
  );
}

function BayarModal({ row, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const muatDetail = () =>
    api.get(`/cicilan/penjualan/${row.penjualanId}/pembayaran`).then((res) => {
      setDetail(res.data);
      return res.data;
    });

  useEffect(() => {
    muatDetail().then((d) => {
      if (d.cicilanBerikutnya) setJumlah(String(d.cicilanBerikutnya.sisa));
    });
  }, []);

  const bisaBayar = detail && detail.status !== "DIBATALKAN" && detail.ringkasan.sisaPiutang > 0;
  const jumlahNum = Number(jumlah);
  const jumlahValid = Number.isInteger(jumlahNum) && jumlahNum > 0;

  async function simpan(e) {
    e.preventDefault();
    setError("");
    if (!jumlahValid) return setError("Masukkan jumlah pembayaran berupa angka bulat lebih dari 0");
    if (jumlahNum > detail.ringkasan.sisaPiutang) {
      return setError(`Jumlah melebihi sisa piutang (${formatRupiah(detail.ringkasan.sisaPiutang)})`);
    }
    setSaving(true);
    try {
      const res = await api.post(`/cicilan/penjualan/${row.penjualanId}/bayar`, { jumlah: jumlahNum, catatan });
      const d = await muatDetail();
      onSaved();
      setCatatan("");
      setJumlah(d.cicilanBerikutnya ? String(d.cicilanBerikutnya.sisa) : "");
      if (confirm("Pembayaran tersimpan. Cetak bukti pembayaran (Word)?")) {
        await cetakBukti(res.data.pembayaran.id, detail.nomorTransaksi);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan pembayaran");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">{row.pelangganNama}</h3>
            <p className="text-xs text-gray-500">{row.nomorTransaksi}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!detail ? (
          <p className="text-sm text-gray-400">Memuat...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <Info label="Total Tagihan" value={formatRupiah(detail.ringkasan.totalTagihan)} />
              <Info label="Sudah Dibayar" value={formatRupiah(detail.ringkasan.totalTerbayar)} />
              <Info label="Sisa Piutang" value={formatRupiah(detail.ringkasan.sisaPiutang)} bold />
              <Info
                label="Tunggakan"
                value={formatRupiah(detail.ringkasan.tunggakan)}
                warn={detail.ringkasan.tunggakan > 0}
              />
            </div>

            {bisaBayar ? (
              <form onSubmit={simpan} className="border border-gray-200 rounded-lg p-4 mb-4">
                <label className="block text-xs text-gray-500 mb-1">Jumlah dibayar (Rp)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span>{jumlahValid ? formatRupiah(jumlahNum) : ""}</span>
                  <button
                    type="button"
                    className="text-primary-600 hover:underline"
                    onClick={() => setJumlah(String(detail.ringkasan.sisaPiutang))}
                  >
                    Lunasi semua ({formatRupiah(detail.ringkasan.sisaPiutang)})
                  </button>
                </div>
                {detail.cicilanBerikutnya && (
                  <p className="text-xs text-gray-400 mt-2">
                    Uang masuk ke cicilan paling lama yang belum lunas, mulai dari cicilan ke-
                    {detail.cicilanBerikutnya.cicilanKe} (sisa {formatRupiah(detail.cicilanBerikutnya.sisa)}).
                  </p>
                )}
                <label className="block text-xs text-gray-500 mt-3 mb-1">Catatan (opsional)</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full text-sm"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
                {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
                <button
                  disabled={saving}
                  className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                {detail.status === "DIBATALKAN"
                  ? "Transaksi ini sudah dibatalkan, pembayaran tidak bisa dicatat."
                  : "Transaksi ini sudah lunas."}
              </p>
            )}

            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Riwayat Pembayaran</h4>
            <ul className="divide-y divide-gray-100 text-sm">
              {detail.pembayaran.map((p) => (
                <li key={p.id} className="py-2 flex justify-between items-center gap-2">
                  <div>
                    <div className="font-medium">{formatRupiah(p.jumlah)}</div>
                    <div className="text-xs text-gray-500">
                      {formatTanggal(p.tanggal)} · cicilan{" "}
                      {p.cicilanDari === p.cicilanSampai ? p.cicilanDari : `${p.cicilanDari}-${p.cicilanSampai}`}
                      {p.catatan ? ` · ${p.catatan}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => cetakBukti(p.id, detail.nomorTransaksi)}
                    className="text-primary-600 hover:underline text-xs whitespace-nowrap"
                  >
                    Cetak Bukti
                  </button>
                </li>
              ))}
              {detail.pembayaran.length === 0 && <li className="py-2 text-gray-400">Belum ada pembayaran</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, bold, warn }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`${bold ? "font-bold" : "font-medium"} ${warn ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}
