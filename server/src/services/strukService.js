const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const TEMPLATE_PATH = path.join(__dirname, "../templates/Template_Struk_Primaboga.docx");

function formatRupiah(angka) {
  return "Rp" + Number(angka).toLocaleString("id-ID");
}

function formatTanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Render struk PENJUALAN (dipanggil sesaat setelah transaksi disimpan).
 * penjualan: hasil query Prisma dengan include { items, cicilan }
 */
function buatStrukPenjualan(penjualan) {
  const cicilanPertama = penjualan.cicilan?.find((c) => c.cicilanKe === 1);

  const data = {
    jenis_dokumen: "STRUK PENJUALAN",
    no_transaksi: penjualan.nomorTransaksi,
    tanggal: formatTanggal(penjualan.tanggal),
    pelanggan_nama: penjualan.pelangganNama,
    pelanggan_alamat: penjualan.pelanggan?.alamat || "-",
    pelanggan_hp: penjualan.pelanggan?.hp || "-",
    sales_nama: penjualan.salesNama,
    sales_hp: penjualan.sales?.hp || "-",
    metode: penjualan.metode === "KREDIT" ? "Kredit" : "Cash",
    total_harga: formatRupiah(penjualan.totalHarga),
    items: penjualan.items.map((it, idx) => ({
      no: String(idx + 1),
      nama: it.namaBarang,
      qty: String(it.qty),
      harga: formatRupiah(it.hargaSatuan),
      subtotal: formatRupiah(it.subtotal),
    })),
    kredit: penjualan.metode === "KREDIT",
    cicilan_nominal: cicilanPertama ? formatRupiah(cicilanPertama.nominal) : "",
    cicilan_jumlah: String(penjualan.cicilan?.length || 0),
    cicilan_payment: penjualan.metode === "KREDIT" && !!cicilanPertama,
    cicilan_ke: cicilanPertama ? `${cicilanPertama.cicilanKe} / ${penjualan.cicilan.length}` : "",
    jatuh_tempo: cicilanPertama ? formatTanggal(cicilanPertama.tanggalJatuhTempo) : "",
    jumlah_bayar: cicilanPertama ? formatRupiah(cicilanPertama.nominal) : "",
    sisa_cicilan: cicilanPertama ? String(penjualan.cicilan.length - 1) : "",
    status_cicilan: "LUNAS",
  };

  return renderTemplate(data);
}

/**
 * Render bukti PEMBAYARAN CICILAN (dipanggil saat kasir menekan tombol "Bayar" di menu Pembayaran).
 * penjualan: hasil query Prisma dengan include { items, cicilan }
 * cicilanDibayar: satu row Cicilan yang baru saja dilunasi
 */
function buatBuktiCicilan(penjualan, cicilanDibayar) {
  const totalCicilan = penjualan.cicilan.length;
  const sisaCicilan = penjualan.cicilan.filter(
    (c) => c.status !== "LUNAS" && c.cicilanKe !== cicilanDibayar.cicilanKe
  ).length;

  const data = {
    jenis_dokumen: "BUKTI PEMBAYARAN CICILAN",
    no_transaksi: penjualan.nomorTransaksi,
    tanggal: formatTanggal(cicilanDibayar.tanggalBayar || new Date()),
    pelanggan_nama: penjualan.pelangganNama,
    pelanggan_alamat: penjualan.pelanggan?.alamat || "-",
    pelanggan_hp: penjualan.pelanggan?.hp || "-",
    sales_nama: penjualan.salesNama,
    sales_hp: penjualan.sales?.hp || "-",
    metode: "Kredit",
    total_harga: formatRupiah(penjualan.totalHarga),
    items: penjualan.items.map((it, idx) => ({
      no: String(idx + 1),
      nama: it.namaBarang,
      qty: String(it.qty),
      harga: formatRupiah(it.hargaSatuan),
      subtotal: formatRupiah(it.subtotal),
    })),
    kredit: true,
    cicilan_nominal: formatRupiah(cicilanDibayar.nominal),
    cicilan_jumlah: String(totalCicilan),
    cicilan_payment: true,
    cicilan_ke: `${cicilanDibayar.cicilanKe} / ${totalCicilan}`,
    jatuh_tempo: formatTanggal(cicilanDibayar.tanggalJatuhTempo),
    jumlah_bayar: formatRupiah(cicilanDibayar.nominal),
    sisa_cicilan: String(sisaCicilan),
    status_cicilan: "LUNAS",
  };

  return renderTemplate(data);
}

function renderTemplate(data) {
  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}

module.exports = { buatStrukPenjualan, buatBuktiCicilan };
