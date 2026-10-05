const express = require("express");
const prisma = require("../db");
const { nomorTransaksiBerikutnya } = require("../utils/nomorTransaksi");
const { buatJadwalCicilan } = require("../utils/jadwalCicilan");
const { buatStrukPenjualan } = require("../services/strukService");

const router = express.Router();

const includeFull = {
  items: true,
  cicilan: { orderBy: { cicilanKe: "asc" } },
  pelanggan: true,
  sales: true,
};

// GET /api/penjualan?tanggalAwal=&tanggalAkhir=&salesId=&metode=
router.get("/", async (req, res) => {
  const { tanggalAwal, tanggalAkhir, salesId, metode } = req.query;
  const where = {};
  if (tanggalAwal || tanggalAkhir) {
    where.tanggal = {};
    if (tanggalAwal) where.tanggal.gte = new Date(tanggalAwal);
    if (tanggalAkhir) where.tanggal.lte = new Date(tanggalAkhir);
  }
  if (salesId) where.salesId = Number(salesId);
  if (metode) where.metode = metode;

  const penjualan = await prisma.penjualan.findMany({
    where,
    include: includeFull,
    orderBy: { tanggal: "desc" },
  });
  res.json(penjualan);
});

router.get("/:id", async (req, res) => {
  const penjualan = await prisma.penjualan.findUnique({
    where: { id: Number(req.params.id) },
    include: includeFull,
  });
  if (!penjualan) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
  res.json(penjualan);
});

/**
 * POST /api/penjualan
 * body: {
 *   pelangganId, salesId, metode: "CASH" | "KREDIT",
 *   items: [{ produkId, qty }]
 * }
 * Harga & subtotal dihitung di server dari harga produk saat ini (snapshot),
 * bukan dipercaya dari input client, supaya tidak bisa dimanipulasi.
 */
router.post("/", async (req, res) => {
  const { pelangganId, salesId, metode, items } = req.body;

  if (!pelangganId || !salesId || !metode || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "pelangganId, salesId, metode, dan items wajib diisi" });
  }
  if (!["CASH", "KREDIT"].includes(metode)) {
    return res.status(400).json({ error: "metode harus CASH atau KREDIT" });
  }

  const pelanggan = await prisma.pelanggan.findUnique({ where: { id: Number(pelangganId) } });
  const sales = await prisma.sales.findUnique({ where: { id: Number(salesId) } });
  if (!pelanggan) return res.status(400).json({ error: "Pelanggan tidak ditemukan" });
  if (!sales) return res.status(400).json({ error: "Sales tidak ditemukan" });

  // ambil harga produk terbaru dari DB (snapshot saat ini, bukan dari client)
  const produkIds = items.map((it) => Number(it.produkId));
  const produkList = await prisma.produk.findMany({ where: { id: { in: produkIds } } });
  const produkMap = new Map(produkList.map((p) => [p.id, p]));

  const itemsData = items.map((it) => {
    const produk = produkMap.get(Number(it.produkId));
    if (!produk) throw new Error(`Produk id ${it.produkId} tidak ditemukan`);
    const qty = Number(it.qty) || 1;
    const subtotal = produk.harga * qty;
    return {
      produkId: produk.id,
      namaBarang: produk.nama,
      hargaSatuan: produk.harga,
      qty,
      subtotal,
    };
  });

  const totalHarga = itemsData.reduce((sum, it) => sum + it.subtotal, 0);
  const tanggal = new Date();
  const nomorTransaksi = await nomorTransaksiBerikutnya();

  const result = await prisma.$transaction(async (tx) => {
    const penjualan = await tx.penjualan.create({
      data: {
        nomorTransaksi,
        tanggal,
        pelangganId: pelanggan.id,
        salesId: sales.id,
        pelangganNama: pelanggan.nama,
        salesNama: sales.nama,
        metode,
        totalHarga,
        items: { create: itemsData },
      },
    });

    // Jika Kredit: buat 10 jadwal cicilan, cicilan ke-1 otomatis Lunas hari ini
    if (metode === "KREDIT") {
      const jadwal = buatJadwalCicilan(tanggal, totalHarga, 10);

      await tx.cicilan.createMany({
        data: jadwal.map((c) => ({
          penjualanId: penjualan.id,
          cicilanKe: c.cicilanKe,
          nominal: c.nominal,
          terbayar: c.cicilanKe === 1 ? c.nominal : 0,
          tanggalJatuhTempo: c.tanggalJatuhTempo,
          status: c.cicilanKe === 1 ? "LUNAS" : "BELUM_LUNAS",
          tanggalBayar: c.cicilanKe === 1 ? tanggal : null,
        })),
      });

      // pembayaran pertama (cicilan ke-1) juga dicatat, supaya riwayat pembayaran lengkap
      const pertama = jadwal[0].nominal;
      await tx.pembayaran.create({
        data: {
          penjualanId: penjualan.id,
          tanggal,
          jumlah: pertama,
          cicilanDari: 1,
          cicilanSampai: 1,
          totalTerbayarSetelah: pertama,
          sisaPiutangSetelah: totalHarga - pertama,
          tunggakanSetelah: 0,
        },
      });
    }

    return tx.penjualan.findUnique({ where: { id: penjualan.id }, include: includeFull });
  });

  res.status(201).json(result);
});

// GET /api/penjualan/:id/struk -> download file .docx struk penjualan
router.get("/:id/struk", async (req, res) => {
  const penjualan = await prisma.penjualan.findUnique({
    where: { id: Number(req.params.id) },
    include: includeFull,
  });
  if (!penjualan) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

  const buffer = buatStrukPenjualan(penjualan);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Struk_${penjualan.nomorTransaksi}.docx"`
  );
  res.send(buffer);
});

// PUT /api/penjualan/:id/batalkan
router.put("/:id/batalkan", async (req, res) => {
  const penjualan = await prisma.penjualan.update({
    where: { id: Number(req.params.id) },
    data: { status: "DIBATALKAN" },
  });
  res.json(penjualan);
});

module.exports = router;
