const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/pelanggan?q=budi
router.get("/", async (req, res) => {
  const { q } = req.query;
  const where = q
    ? {
        OR: [
          { nama: { contains: q } },
          { hp: { contains: q } },
        ],
      }
    : {};
  const pelanggan = await prisma.pelanggan.findMany({ where, orderBy: { nama: "asc" } });
  res.json(pelanggan);
});

router.get("/:id", async (req, res) => {
  const pelanggan = await prisma.pelanggan.findUnique({ where: { id: Number(req.params.id) } });
  if (!pelanggan) return res.status(404).json({ error: "Pelanggan tidak ditemukan" });
  res.json(pelanggan);
});

router.post("/", async (req, res) => {
  const { nama, alamat, hp, ktp, catatan } = req.body;
  if (!nama) return res.status(400).json({ error: "nama wajib diisi" });
  const pelanggan = await prisma.pelanggan.create({ data: { nama, alamat, hp, ktp, catatan } });
  res.status(201).json(pelanggan);
});

router.put("/:id", async (req, res) => {
  const { nama, alamat, hp, ktp, catatan } = req.body;
  const pelanggan = await prisma.pelanggan.update({
    where: { id: Number(req.params.id) },
    data: { nama, alamat, hp, ktp, catatan },
  });
  res.json(pelanggan);
});

router.delete("/:id", async (req, res) => {
  await prisma.pelanggan.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;
