/**
 * Menambahkan sejumlah bulan ke tanggal, dengan aturan "clamp ke tanggal terakhir bulan".
 * Contoh: 31 Januari + 1 bulan -> 28/29 Februari (bulan pendek tidak punya tgl 31),
 * tapi 31 Januari + 2 bulan -> 31 Maret (kembali ke tanggal asli, bukan ikut Februari).
 * Ini pendekatan standar sistem cicilan/leasing supaya tanggal jatuh tempo mudah diingat pelanggan.
 */
function tambahBulanClamped(tanggalAwal, jumlahBulan) {
  const asal = new Date(tanggalAwal);
  const tanggalAsli = asal.getDate();

  const targetTahunBulan = new Date(asal.getFullYear(), asal.getMonth() + jumlahBulan, 1);
  const hariTerakhirBulanTarget = new Date(
    targetTahunBulan.getFullYear(),
    targetTahunBulan.getMonth() + 1,
    0
  ).getDate();

  targetTahunBulan.setDate(Math.min(tanggalAsli, hariTerakhirBulanTarget));
  return targetTahunBulan;
}

/**
 * Membuat jadwal 10 cicilan dari tanggal transaksi.
 * Cicilan ke-1 jatuh tempo = tanggal transaksi itu sendiri (karena otomatis lunas saat itu juga).
 */
function buatJadwalCicilan(tanggalTransaksi, nominalPerCicilan, jumlahCicilan = 10) {
  const jadwal = [];
  for (let ke = 1; ke <= jumlahCicilan; ke++) {
    const jatuhTempo =
      ke === 1 ? new Date(tanggalTransaksi) : tambahBulanClamped(tanggalTransaksi, ke - 1);
    jadwal.push({
      cicilanKe: ke,
      nominal: nominalPerCicilan,
      tanggalJatuhTempo: jatuhTempo,
    });
  }
  return jadwal;
}

module.exports = { tambahBulanClamped, buatJadwalCicilan };
