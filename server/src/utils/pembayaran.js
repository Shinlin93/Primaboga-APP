/**
 * Logika murni (tanpa database) untuk pembayaran cicilan.
 * Prinsip: jadwal cicilan tidak berubah. Uang yang masuk dialokasikan ke cicilan
 * paling lama yang belum lunas. Piutang = total nominal - total terbayar.
 */

function akhirHari(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * cicilanList: [{ nominal, terbayar, tanggalJatuhTempo }]
 * Tunggakan = total yang seharusnya sudah dibayar sampai hari ini - total yang sudah dibayar.
 */
function hitungRingkasan(cicilanList, sekarang = new Date()) {
  const batas = akhirHari(sekarang);
  const totalTagihan = cicilanList.reduce((sum, c) => sum + c.nominal, 0);
  const totalTerbayar = cicilanList.reduce((sum, c) => sum + c.terbayar, 0);
  const seharusnya = cicilanList
    .filter((c) => new Date(c.tanggalJatuhTempo) <= batas)
    .reduce((sum, c) => sum + c.nominal, 0);
  return {
    totalTagihan,
    totalTerbayar,
    sisaPiutang: totalTagihan - totalTerbayar,
    tunggakan: Math.max(0, seharusnya - totalTerbayar),
  };
}

function statusCicilan(nominal, terbayar) {
  if (terbayar >= nominal) return "LUNAS";
  if (terbayar > 0) return "SEBAGIAN";
  return "BELUM_LUNAS";
}

/**
 * Membagi `jumlah` ke cicilan yang belum lunas, mulai dari cicilanKe terkecil.
 * Mengembalikan daftar cicilan yang berubah + rentang cicilan yang tersentuh.
 * Tidak mengubah objek masukan.
 */
function alokasikan(cicilanList, jumlah) {
  const urut = [...cicilanList].sort((a, b) => a.cicilanKe - b.cicilanKe);
  let sisaUang = jumlah;
  const perubahan = [];

  for (const c of urut) {
    if (sisaUang <= 0) break;
    const kurang = c.nominal - c.terbayar;
    if (kurang <= 0) continue;
    const masuk = Math.min(sisaUang, kurang);
    const terbayarBaru = c.terbayar + masuk;
    perubahan.push({
      id: c.id,
      cicilanKe: c.cicilanKe,
      masuk,
      terbayar: terbayarBaru,
      status: statusCicilan(c.nominal, terbayarBaru),
    });
    sisaUang -= masuk;
  }

  return {
    perubahan,
    sisaUang, // > 0 hanya kalau jumlah melebihi seluruh piutang (seharusnya sudah ditolak sebelumnya)
    cicilanDari: perubahan.length ? perubahan[0].cicilanKe : null,
    cicilanSampai: perubahan.length ? perubahan[perubahan.length - 1].cicilanKe : null,
  };
}

module.exports = { hitungRingkasan, statusCicilan, alokasikan };
