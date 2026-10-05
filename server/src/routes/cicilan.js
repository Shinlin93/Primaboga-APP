const express = require("express");
const prisma = require("../db");
const { buatBuktiPembayaran } = require("../services/strukService");
const { catatPembayaran, ErrorBisnis } = require("../services/pembayaranService");
const { hitungRingkasan } = require("../utils/pembayaran");

const router = express.Router();

const includeFull = {
  penjualan: { include: { items: true, pelanggan: true, sales: true, cicilan: true } },
};

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * GET /api/cicilan?q=budi&status=BELUM_LUNAS
 * Cari berdasarkan nama pelanggan, no HP, atau nomor transaksi.
 * status=BELUM_LUNAS berarti semua yang belum lunas penuh (BELUM_LUNAS + SEBAGIAN).
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

  let cicilanWhere = {};
  if (status === "BELUM_LUNAS") cicilanWhere = { status: { in: ["BELUM_LUNAS", "SEBAGIAN"] } };
  else if (status) cicilanWhere = { status };

  const cicilan = await prisma.cicilan.findMany({
    where: { ...cicilanWhere, penjualan: wherePenjualan },
    include: includeFull,
    orderBy: [{ tanggalJatuhTempo: "asc" }],
  });

  const rows = cicilan.map((c) => {
    const ringkasan = hitungRingkasan(c.penjualan.cicilan);
    return {
      id: c.id,
      penjualanId: c.penjualanId,
      penjualanStatus: c.penjualan.status,
      nomorTransaksi: c.penjualan.nomorTransaksi,
      pelangganNama: c.penjualan.pelangganNama,
      salesNama: c.penjualan.salesNama,
      barang: c.penjualan.items.map((it) => it.namaBarang).join(", "),
      cicilanKe: c.cicilanKe,
      totalCicilan: c.penjualan.cicilan.length,
      tanggalJatuhTempo: c.tanggalJatuhTempo,
      nominal: c.nominal,
      terbayar: c.terbayar,
      sisa: c.nominal - c.terbayar,
      sisaPiutangTransaksi: ringkasan.sisaPiutang,
      status: c.status,
    };
  });

  res.json(rows);
});

/**
 * GET /api/cicilan/penjualan/:id/pembayaran
 * Ringkasan piutang + riwayat pembayaran + cicilan berikutnya yang akan terisi.
 */
router.get("/penjualan/:id/pembayaran", async (req, res) => {
  const id = Number(req.params.id);
  const penjualan = await prisma.penjualan.findUnique({
    where: { id },
    include: {
      cicilan: { orderBy: { cicilanKe: "asc" } },
      pembayaran: { orderBy: { id: "desc" } },
    },
  });
  if (!penjualan) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

  const berikutnya = penjualan.cicilan.find((c) => c.terbayar < c.nominal);
  res.json({
    nomorTransaksi: penjualan.nomorTransaksi,
    pelangganNama: penjualan.pelangganNama,
    status: penjualan.status,
    ringkasan: hitungRingkasan(penjualan.cicilan),
    cicilanBerikutnya: berikutnya
      ? { cicilanKe: berikutnya.cicilanKe, sisa: berikutnya.nominal - berikutnya.terbayar }
      : null,
    pembayaran: penjualan.pembayaran,
  });
});

/**
 * POST /api/cicilan/penjualan/:id/bayar
 * body: { jumlah: number (rupiah, bulat), catatan?: string }
 * Uang dialokasikan ke cicilan paling lama yang belum lunas.
 */
router.post("/penjualan/:id/bayar", async (req, res) => {
  const penjualanId = Number(req.params.id);
  const jumlah = Number(req.body.jumlah);
  const catatan = typeof req.body.catatan === "string" ? req.body.catatan.trim() : "";

  try {
    const hasil = await prisma.$transaction((tx) => catatPembayaran(tx, penjualanId, jumlah, catatan));
    res.status(201).json(hasil);
  } catch (err) {
    if (err instanceof ErrorBisnis) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

async function kirimBukti(res, pembayaranId) {
  const pembayaran = await prisma.pembayaran.findUnique({ where: { id: pembayaranId } });
  if (!pembayaran) return res.status(404).json({ error: "Pembayaran tidak ditemukan" });

  const penjualan = await prisma.penjualan.findUnique({
    where: { id: pembayaran.penjualanId },
    include: { items: true, pelanggan: true, sales: true, cicilan: { orderBy: { cicilanKe: "asc" } } },
  });

  const buffer = buatBuktiPembayaran(penjualan, pembayaran);
  res.setHeader("Content-Type", DOCX_MIME);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Bukti_${penjualan.nomorTransaksi}_${pembayaran.id}.docx"`
  );
  res.send(buffer);
}

// GET /api/cicilan/pembayaran/:id/bukti -> bukti satu pembayaran (.docx)
router.get("/pembayaran/:id/bukti", async (req, res) => {
  await kirimBukti(res, Number(req.params.id));
});

// GET /api/cicilan/:id/bukti -> bukti pembayaran terakhir yang menyentuh cicilan ini (.docx)
router.get("/:id/bukti", async (req, res) => {
  const cicilan = await prisma.cicilan.findUnique({ where: { id: Number(req.params.id) } });
  if (!cicilan) return res.status(404).json({ error: "Cicilan tidak ditemukan" });

  const pembayaran = await prisma.pembayaran.findFirst({
    where: {
      penjualanId: cicilan.penjualanId,
      cicilanDari: { lte: cicilan.cicilanKe },
      cicilanSampai: { gte: cicilan.cicilanKe },
    },
    orderBy: { id: "desc" },
  });
  if (!pembayaran) return res.status(404).json({ error: "Belum ada pembayaran untuk cicilan ini" });

  await kirimBukti(res, pembayaran.id);
});

module.exports = router;
