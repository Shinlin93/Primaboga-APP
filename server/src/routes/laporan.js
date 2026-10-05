const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/laporan/penjualan?tanggalAwal=&tanggalAkhir=&salesId=&metode=
router.get("/penjualan", async (req, res) => {
  const { tanggalAwal, tanggalAkhir, salesId, metode } = req.query;
  const where = { status: "SELESAI" };
  if (tanggalAwal || tanggalAkhir) {
    where.tanggal = {};
    if (tanggalAwal) where.tanggal.gte = new Date(tanggalAwal);
    if (tanggalAkhir) where.tanggal.lte = new Date(tanggalAkhir);
  }
  if (salesId) where.salesId = Number(salesId);
  if (metode) where.metode = metode;

  const data = await prisma.penjualan.findMany({
    where,
    include: { items: true },
    orderBy: { tanggal: "asc" },
  });

  res.json({
    data,
    ringkasan: {
      totalTransaksi: data.length,
      totalOmzet: data.reduce((sum, p) => sum + p.totalHarga, 0),
    },
  });
});

// GET /api/laporan/cicilan?filter=belum_lunas|lunas|jatuh_tempo_hari_ini|bulan_ini
router.get("/cicilan", async (req, res) => {
  const { filter } = req.query;
  const where = {};

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (filter === "belum_lunas") where.status = "BELUM_LUNAS";
  else if (filter === "lunas") where.status = "LUNAS";
  else if (filter === "jatuh_tempo_hari_ini") {
    where.tanggalJatuhTempo = { gte: startToday, lte: endToday };
    where.status = "BELUM_LUNAS";
  } else if (filter === "bulan_ini") {
    where.tanggalJatuhTempo = { gte: startMonth, lte: endMonth };
  }

  const data = await prisma.cicilan.findMany({
    where,
    include: { penjualan: { select: { nomorTransaksi: true, pelangganNama: true, salesNama: true } } },
    orderBy: { tanggalJatuhTempo: "asc" },
  });

  res.json(data);
});

module.exports = router;
