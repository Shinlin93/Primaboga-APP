const express = require("express");
const prisma = require("../db");

const router = express.Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

router.get("/", async (req, res) => {
  const today = { gte: startOfToday(), lte: endOfToday() };

  const [penjualanHariIni, totalPelanggan, totalSales, cicilanBelumLunas] = await Promise.all([
    prisma.penjualan.findMany({
      where: { tanggal: today, status: "SELESAI" },
      select: { metode: true, totalHarga: true },
    }),
    prisma.pelanggan.count(),
    prisma.sales.count({ where: { status: true } }),
    prisma.cicilan.findMany({ where: { status: "BELUM_LUNAS" }, select: { nominal: true } }),
  ]);

  const jumlahCash = penjualanHariIni.filter((p) => p.metode === "CASH").length;
  const jumlahKredit = penjualanHariIni.filter((p) => p.metode === "KREDIT").length;
  // Omzet hari ini = total nilai transaksi (harga barang penuh), bukan hanya uang cash masuk,
  // supaya konsisten dengan "Total Piutang" di bawah (lihat catatan desain).
  const omzetHariIni = penjualanHariIni.reduce((sum, p) => sum + p.totalHarga, 0);

  const totalPiutang = cicilanBelumLunas.reduce((sum, c) => sum + c.nominal, 0);

  res.json({
    hariIni: {
      jumlahPenjualanCash: jumlahCash,
      jumlahPenjualanKredit: jumlahKredit,
      omzetHariIni,
    },
    keseluruhan: {
      totalPiutang,
      totalCicilanBelumLunas: cicilanBelumLunas.length,
      totalPelanggan,
      totalSales,
    },
  });
});

module.exports = router;
