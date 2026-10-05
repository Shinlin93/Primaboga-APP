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

function dataDasar(penjualan, tanggal, jenisDokumen, metodeLabel) {
  return {
    jenis_dokumen: jenisDokumen,
    no_transaksi: penjualan.nomorTransaksi,
    tanggal: formatTanggal(tanggal),
    pelanggan_nama: penjualan.pelangganNama,
    pelanggan_alamat: penjualan.pelanggan?.alamat || "-",
    pelanggan_hp: penjualan.pelanggan?.hp || "-",
    sales_nama: penjualan.salesNama,
    sales_hp: penjualan.sales?.hp || "-",
    metode: metodeLabel,
    total_harga: formatRupiah(penjualan.totalHarga),
    items: penjualan.items.map((it, idx) => ({
      no: String(idx + 1),
      nama: it.namaBarang,
      qty: String(it.qty),
      harga: formatRupiah(it.hargaSatuan),
      subtotal: formatRupiah(it.subtotal),
    })),
  };
}

/**
 * Render struk PENJUALAN (dipanggil sesaat setelah transaksi disimpan).
 * penjualan: hasil query Prisma dengan include { items, cicilan }
 * Untuk kredit, bagian pembayaran selalu menunjukkan cicilan ke-1 (dibayar saat transaksi).
 */
function buatStrukPenjualan(penjualan) {
  const kredit = penjualan.metode === "KREDIT";
  const cicilanPertama = penjualan.cicilan?.find((c) => c.cicilanKe === 1);
  const totalTagihan = (penjualan.cicilan || []).reduce((sum, c) => sum + c.nominal, 0);
  const bayarPertama = cicilanPertama ? cicilanPertama.nominal : 0;

  const data = {
    ...dataDasar(penjualan, penjualan.tanggal, "STRUK PENJUALAN", kredit ? "Kredit" : "Cash"),
    kredit,
    cicilan_nominal: cicilanPertama ? formatRupiah(cicilanPertama.nominal) : "",
    cicilan_jumlah: String(penjualan.cicilan?.length || 0),
    cicilan_payment: kredit && !!cicilanPertama,
    cicilan_ke: cicilanPertama ? `${cicilanPertama.cicilanKe} / ${penjualan.cicilan.length}` : "",
    jatuh_tempo: cicilanPertama ? formatTanggal(cicilanPertama.tanggalJatuhTempo) : "",
    jumlah_bayar: formatRupiah(bayarPertama),
    sisa_cicilan: formatRupiah(totalTagihan - bayarPertama), // sisa piutang
    total_terbayar: formatRupiah(bayarPertama),
    tunggakan: formatRupiah(0),
    status_cicilan: "LUNAS",
  };

  return renderTemplate(data);
}

/**
 * Render bukti PEMBAYARAN CICILAN untuk satu catatan Pembayaran.
 * penjualan: hasil query Prisma dengan include { items, pelanggan, sales, cicilan }
 * pembayaran: satu row Pembayaran (berisi snapshot saldo saat pembayaran terjadi)
 */
function buatBuktiPembayaran(penjualan, pembayaran) {
  const totalCicilan = penjualan.cicilan.length;
  const { cicilanDari, cicilanSampai } = pembayaran;
  const cicilanAwal = penjualan.cicilan.find((c) => c.cicilanKe === cicilanDari);

  // karena uang dialokasikan berurutan, cicilan 1..cicilanSampai sudah lunas
  // kalau total terbayar >= jumlah nominal cicilan 1..cicilanSampai
  const wajibSampai = penjualan.cicilan
    .filter((c) => c.cicilanKe <= cicilanSampai)
    .reduce((sum, c) => sum + c.nominal, 0);
  const status = pembayaran.totalTerbayarSetelah >= wajibSampai ? "LUNAS" : "SEBAGIAN";

  const data = {
    ...dataDasar(penjualan, pembayaran.tanggal, "BUKTI PEMBAYARAN CICILAN", "Kredit"),
    kredit: true,
    cicilan_nominal: cicilanAwal ? formatRupiah(cicilanAwal.nominal) : "",
    cicilan_jumlah: String(totalCicilan),
    cicilan_payment: true,
    cicilan_ke:
      cicilanDari === cicilanSampai
        ? `${cicilanDari} / ${totalCicilan}`
        : `${cicilanDari} - ${cicilanSampai} / ${totalCicilan}`,
    jatuh_tempo: cicilanAwal ? formatTanggal(cicilanAwal.tanggalJatuhTempo) : "-",
    jumlah_bayar: formatRupiah(pembayaran.jumlah),
    sisa_cicilan: formatRupiah(pembayaran.sisaPiutangSetelah), // sisa piutang
    total_terbayar: formatRupiah(pembayaran.totalTerbayarSetelah),
    tunggakan: formatRupiah(pembayaran.tunggakanSetelah),
    status_cicilan: status,
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

module.exports = { buatStrukPenjualan, buatBuktiPembayaran };
