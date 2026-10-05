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
 * Membuat jadwal cicilan dari tanggal transaksi.
 * Total harga dibagi rata (dibulatkan ke bawah); cicilan TERAKHIR menanggung sisa pembulatan,
 * sehingga jumlah semua cicilan selalu persis sama dengan total harga.
 * Contoh: 999.995 / 10 -> 9 x 99.999 + 1 x 100.004.
 * Cicilan ke-1 jatuh tempo = tanggal transaksi itu sendiri (karena otomatis lunas saat itu juga).
 */
function buatJadwalCicilan(tanggalTransaksi, totalHarga, jumlahCicilan = 10) {
  const dasar = Math.floor(totalHarga / jumlahCicilan);
  const jadwal = [];
  for (let ke = 1; ke <= jumlahCicilan; ke++) {
    const jatuhTempo =
      ke === 1 ? new Date(tanggalTransaksi) : tambahBulanClamped(tanggalTransaksi, ke - 1);
    const nominal = ke === jumlahCicilan ? totalHarga - dasar * (jumlahCicilan - 1) : dasar;
    jadwal.push({ cicilanKe: ke, nominal, tanggalJatuhTempo: jatuhTempo });
  }
  return jadwal;
}

module.exports = { tambahBulanClamped, buatJadwalCicilan };
