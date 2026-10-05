const express = require("express");
const cors = require("cors");
require("express-async-errors"); // supaya error di async route handler otomatis ditangkap

const produkRoutes = require("./routes/produk");
const salesRoutes = require("./routes/sales");
const pelangganRoutes = require("./routes/pelanggan");
const penjualanRoutes = require("./routes/penjualan");
const cicilanRoutes = require("./routes/cicilan");
const dashboardRoutes = require("./routes/dashboard");
const laporanRoutes = require("./routes/laporan");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/produk", produkRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/pelanggan", pelangganRoutes);
app.use("/api/penjualan", penjualanRoutes);
app.use("/api/cicilan", cicilanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/laporan", laporanRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// error handler terpusat — supaya error Prisma/validasi tidak bikin server crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Terjadi kesalahan pada server" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Primaboga server jalan di http://localhost:${PORT}`);
});
