const express = require("express");
const prisma = require("../db");
const { buatBuktiCicilan } = require("../services/strukService");

const router = express.Router();

const includeFull = {
  penjualan: { include: { items: true, pelanggan: true, sales: true, cicilan: true } },
};

/**
 * GET /api/cicilan?q=budi
 * Cari berdasarkan nama pelanggan, no HP, atau nomor transaksi.
 * Mengembalikan daftar cicilan (flat) beserta info transaksinya untuk ditampilkan di tabel.
 */
router.get("/", async (req, res) => {
  const { q, status } = req.query;

  const wherePenjualan = q
    ? {
        OR: [
          { nomorTransaksi: { contains: q } },
          { pelangganNama: { contains: q } },
          { pelanggan: { hp: { contains: q } } },
        ],
      }
    : {};

  const cicilanWhere = status ? { status } : {};

  const cicilan = await prisma.cicilan.findMany({
    where: {
      ...cicilanWhere,
      penjualan: wherePenjualan,
    },
    include: includeFull,
    orderBy: [{ tanggalJatuhTempo: "asc" }],
  });

  const rows = cicilan.map((c) => ({
    id: c.id,
    penjualanId: c.penjualanId,
    nomorTransaksi: c.penjualan.nomorTransaksi,
    pelangganNama: c.penjualan.pelangganNama,
    salesNama: c.penjualan.salesNama,
    barang: c.penjualan.items.map((it) => it.namaBarang).join(", "),
    cicilanKe: c.cicilanKe,
    totalCicilan: c.penjualan.cicilan.length,
    tanggalJatuhTempo: c.tanggalJatuhTempo,
    nominal: c.nominal,
    status: c.status,
  }));

  res.json(rows);
});

/**
 * PUT /api/cicilan/:id/bayar
 * Menandai cicilan sebagai Lunas + simpan tanggal bayar.
 */
router.put("/:id/bayar", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.cicilan.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Cicilan tidak ditemukan" });
  if (existing.status === "LUNAS") {
    return res.status(400).json({ error: "Cicilan ini sudah lunas" });
  }

  const cicilan = await prisma.cicilan.update({
    where: { id },
    data: { status: "LUNAS", tanggalBayar: new Date() },
  });

  res.json(cicilan);
});

// GET /api/cicilan/:id/bukti -> download bukti pembayaran cicilan (.docx)
router.get("/:id/bukti", async (req, res) => {
  const id = Number(req.params.id);
  const cicilan = await prisma.cicilan.findUnique({
    where: { id },
    include: includeFull,
  });
  if (!cicilan) return res.status(404).json({ error: "Cicilan tidak ditemukan" });

  const buffer = buatBuktiCicilan(cicilan.penjualan, cicilan);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Cicilan_${cicilan.penjualan.nomorTransaksi}_${cicilan.cicilanKe}.docx"`
  );
  res.send(buffer);
});

module.exports = router;
