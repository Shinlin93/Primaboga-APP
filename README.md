# Primaboga Cookware — Sistem Penjualan Cash & Kredit

Aplikasi desktop offline untuk mengelola penjualan Cash dan Kredit toko peralatan masak,
dengan pencetakan struk otomatis ke Word (.docx).

## Struktur Project

```
primaboga-app/
├── electron/         # wrapper desktop (Electron)
│   ├── main.js
│   └── preload.js
├── server/            # backend Express + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── db.js
│       ├── routes/           # produk, sales, pelanggan, penjualan, cicilan, dashboard, laporan
│       ├── services/
│       │   └── strukService.js   # generator struk .docx otomatis
│       ├── utils/
│       │   ├── nomorTransaksi.js
│       │   └── jadwalCicilan.js
│       └── templates/
│           └── Template_Struk_Primaboga.docx
└── client/            # frontend React + Vite + TailwindCSS
    └── src/
        ├── pages/     # Dashboard, Penjualan, PembayaranCicilan, Produk, Pelanggan, Sales, Laporan, Pengaturan
        └── components/Sidebar.jsx
```

## Cara Menjalankan (Development)

**Prasyarat:** Node.js 18+ dan npm terpasang di komputer Anda, serta koneksi internet aktif
(untuk `npm install` dan `prisma migrate` men-download engine Prisma).

### 1. Install semua dependency

```bash
cd primaboga-app
npm install
cd server && cp .env.example .env && npm install
cd ../client && npm install
cd ..
```

### 2. Setup database (sekali saja / setiap ada perubahan schema)

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed        # opsional — mengisi beberapa data contoh (produk, sales, pelanggan)
cd ..
```

Perintah ini akan membuat file `server/primaboga.db` (SQLite) dan generate Prisma Client.

### 3. Jalankan aplikasi

**Opsi A — sebagai aplikasi desktop Electron (disarankan, sesuai kebutuhan offline):**

```bash
npm install --save-dev concurrently electron electron-builder wait-on   # sekali saja, di root project
npm run dev
```

Ini otomatis menjalankan: backend Express (port 4000) → frontend Vite (port 5173) → window Electron.

**Opsi B — hanya di browser (untuk development cepat, tanpa Electron):**

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Lalu buka `http://localhost:5173` di browser.

### 4. Build aplikasi jadi installer desktop (.exe / .dmg / .AppImage)

```bash
npm run build
```

Hasil installer ada di folder `dist-electron/`.

## Cara Kerja Bisnis (ringkasan)

- Maksimal 15 produk aktif.
- Harga kredit = harga cash, tanpa bunga.
- Kredit selalu dibagi rata **10x cicilan** (`total harga transaksi ÷ 10`, dibulatkan ke bawah). Sisa pembulatan ditanggung cicilan ke-10, sehingga jumlah 10 cicilan selalu persis sama dengan total harga.
- Saat transaksi kredit dibuat, sistem otomatis membuat 10 jadwal cicilan; **cicilan ke-1 langsung berstatus Lunas** (dianggap pembayaran pertama saat struk dicetak).
- Tanggal jatuh tempo cicilan berikutnya: tanggal transaksi + n bulan, dengan aturan **clamp ke tanggal terakhir bulan** kalau bulan tersebut lebih pendek (mis. transaksi tgl 31 → Februari jatuh tempo tgl 28/29, tapi Maret kembali ke tgl 31).
- Satu transaksi bisa berisi **lebih dari satu barang** (multi-item), total harga dijumlah dulu baru dibagi 10 kalau kredit.
- Struk dan bukti pembayaran cicilan dicetak sebagai file **Word (.docx)** yang otomatis terisi dari data transaksi — bukan cetak langsung ke printer Dot Matrix. Kasir tinggal buka file hasil download lalu print manual.

## Pembayaran Cicilan (bisa sebagian / berbeda tiap bulan)

- Jadwal 10 cicilan **tidak berubah**. Setiap uang yang masuk dicatat sebagai satu **Pembayaran** (tabel `Pembayaran`) dan dialokasikan ke cicilan paling lama yang belum lunas.
- Contoh (harga Rp1.000.000, cicilan Rp100.000): bayar Rp75.000 → cicilan ke-2 berstatus *Sebagian* (sisa Rp25.000). Bayar lagi Rp50.000 → Rp25.000 melunasi cicilan ke-2 dan Rp25.000 masuk cicilan ke-3.
- **Sisa piutang** = total tagihan − total terbayar. **Tunggakan** = total yang seharusnya sudah dibayar sampai hari ini − total terbayar.
- Jumlah bayar yang melebihi sisa piutang ditolak. Pelanggan boleh melunasi lebih cepat dari 10 bulan.
- Catatan pembayaran tidak bisa diedit atau dihapus (jejak audit). Bukti pembayaran bisa dicetak ulang kapan saja dan menampilkan saldo pada saat pembayaran terjadi.
- Setelah update ini, jalankan `cd server && npx prisma migrate dev` sekali (**backup `primaboga.db` dulu**). Cicilan yang sudah Lunas dimigrasi otomatis.

## Keterbatasan versi ini (lihat juga bagian "Rencana Pengembangan" di halaman Pengaturan)

- Belum ada login/multi-user — siapa saja yang membuka aplikasi punya akses penuh.
- Belum ada backup otomatis — disarankan sesekali menyalin file `server/primaboga.db` secara manual ke tempat aman.
- Export Laporan ke PDF/Excel belum diimplementasikan (baru filter + tampilan tabel); tinggal ditambahkan endpoint export sesuai kebutuhan.
- Nomor transaksi (`TRX000001`, dst.) terus berurutan dan tidak reset otomatis per bulan/tahun.

## Troubleshooting

- **Error saat `prisma migrate dev`:** pastikan koneksi internet aktif (Prisma perlu download query engine saat pertama kali dipakai).
- **Window Electron putih/kosong saat `npm run dev`:** tunggu beberapa detik — server Vite & Express butuh waktu untuk siap sebelum window electron dibuka.
- **Struk gagal ter-generate:** pastikan file `server/src/templates/Template_Struk_Primaboga.docx` tidak terhapus/pindah.
