const prisma = require("../db");

/**
 * Menghasilkan nomor transaksi berurutan: TRX000001, TRX000002, ...
 * Counter disimpan di tabel Counter supaya konsisten walau ada banyak transaksi.
 * Tidak reset per bulan/tahun (lihat catatan Future Development kalau nanti perlu direset).
 */
async function nomorTransaksiBerikutnya() {
  const key = "nomor_transaksi";

  const counter = await prisma.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  });

  return "TRX" + String(counter.value).padStart(6, "0");
}

module.exports = { nomorTransaksiBerikutnya };
