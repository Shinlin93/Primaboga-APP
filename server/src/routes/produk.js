const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/produk?status=aktif
router.get("/", async (req, res) => {
  const { status } = req.query;
  const where = status === "aktif" ? { status: true } : {};
  const produk = await prisma.produk.findMany({ where, orderBy: { nama: "asc" } });
  res.json(produk);
});

router.get("/:id", async (req, res) => {
  const produk = await prisma.produk.findUnique({ where: { id: Number(req.params.id) } });
  if (!produk) return res.status(404).json({ error: "Produk tidak ditemukan" });
  res.json(produk);
});

router.post("/", async (req, res) => {
  const { nama, harga, status = true } = req.body;
  if (!nama || !harga) return res.status(400).json({ error: "nama dan harga wajib diisi" });

  const count = await prisma.produk.count();
  if (count >= 15) {
    return res
      .status(400)
      .json({ error: "Jumlah produk sudah mencapai batas maksimal (15 item)" });
  }

  const produk = await prisma.produk.create({ data: { nama, harga: Number(harga), status } });
  res.status(201).json(produk);
});

router.put("/:id", async (req, res) => {
  const { nama, harga, status } = req.body;
  const produk = await prisma.produk.update({
    where: { id: Number(req.params.id) },
    data: { nama, harga: harga !== undefined ? Number(harga) : undefined, status },
  });
  res.json(produk);
});

router.delete("/:id", async (req, res) => {
  // soft-delete: nonaktifkan saja supaya histori transaksi lama tetap valid
  const produk = await prisma.produk.update({
    where: { id: Number(req.params.id) },
    data: { status: false },
  });
  res.json(produk);
});

module.exports = router;
