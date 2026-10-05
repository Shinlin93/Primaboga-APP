const express = require("express");
const prisma = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { status } = req.query;
  const where = status === "aktif" ? { status: true } : {};
  const sales = await prisma.sales.findMany({ where, orderBy: { nama: "asc" } });
  res.json(sales);
});

router.post("/", async (req, res) => {
  const { nama, hp, status = true } = req.body;
  if (!nama) return res.status(400).json({ error: "nama wajib diisi" });
  const sales = await prisma.sales.create({ data: { nama, hp, status } });
  res.status(201).json(sales);
});

router.put("/:id", async (req, res) => {
  const { nama, hp, status } = req.body;
  const sales = await prisma.sales.update({
    where: { id: Number(req.params.id) },
    data: { nama, hp, status },
  });
  res.json(sales);
});

router.delete("/:id", async (req, res) => {
  const sales = await prisma.sales.update({
    where: { id: Number(req.params.id) },
    data: { status: false },
  });
  res.json(sales);
});

module.exports = router;
