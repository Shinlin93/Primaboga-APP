const { hitungRingkasan, alokasikan } = require("../utils/pembayaran");

class ErrorBisnis extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

/**
 * Mencatat satu pembayaran cicilan untuk satu transaksi kredit.
 * Harus dipanggil di dalam prisma.$transaction (parameter `tx`) supaya cicilan dan
 * catatan pembayaran tersimpan bersamaan atau tidak sama sekali.
 */
async function catatPembayaran(tx, penjualanId, jumlah, catatan) {
  if (!Number.isInteger(jumlah) || jumlah <= 0) {
    throw new ErrorBisnis(400, "Jumlah pembayaran harus berupa bilangan bulat lebih dari 0");
  }

  const penjualan = await tx.penjualan.findUnique({
    where: { id: penjualanId },
    include: { cicilan: { orderBy: { cicilanKe: "asc" } } },
  });
  if (!penjualan) throw new ErrorBisnis(404, "Transaksi tidak ditemukan");
  if (penjualan.metode !== "KREDIT") throw new ErrorBisnis(400, "Transaksi ini bukan transaksi kredit");
  if (penjualan.status === "DIBATALKAN") {
    throw new ErrorBisnis(400, "Transaksi sudah dibatalkan, pembayaran tidak bisa dicatat");
  }

  const sebelum = hitungRingkasan(penjualan.cicilan);
  if (sebelum.sisaPiutang <= 0) throw new ErrorBisnis(400, "Transaksi ini sudah lunas");
  if (jumlah > sebelum.sisaPiutang) {
    throw new ErrorBisnis(400, `Jumlah melebihi sisa piutang (${rupiah(sebelum.sisaPiutang)})`);
  }

  const tanggal = new Date();
  const hasil = alokasikan(penjualan.cicilan, jumlah);

  for (const p of hasil.perubahan) {
    await tx.cicilan.update({
      where: { id: p.id },
      data: {
        terbayar: p.terbayar,
        status: p.status,
        ...(p.status === "LUNAS" ? { tanggalBayar: tanggal } : {}),
      },
    });
  }

  // hitung keadaan setelah pembayaran (di memori) untuk snapshot
  const setelahList = penjualan.cicilan.map((c) => {
    const ubah = hasil.perubahan.find((p) => p.id === c.id);
    return ubah ? { ...c, terbayar: ubah.terbayar } : c;
  });
  const setelah = hitungRingkasan(setelahList, tanggal);

  const pembayaran = await tx.pembayaran.create({
    data: {
      penjualanId,
      tanggal,
      jumlah,
      catatan: catatan || null,
      cicilanDari: hasil.cicilanDari,
      cicilanSampai: hasil.cicilanSampai,
      totalTerbayarSetelah: setelah.totalTerbayar,
      sisaPiutangSetelah: setelah.sisaPiutang,
      tunggakanSetelah: setelah.tunggakan,
    },
  });

  return { pembayaran, ringkasan: setelah };
}

module.exports = { catatPembayaran, ErrorBisnis };
