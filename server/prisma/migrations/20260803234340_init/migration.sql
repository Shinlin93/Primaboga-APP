-- CreateTable
CREATE TABLE "Produk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "hp" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pelanggan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "hp" TEXT,
    "ktp" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Penjualan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomorTransaksi" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "pelangganId" INTEGER NOT NULL,
    "salesId" INTEGER NOT NULL,
    "pelangganNama" TEXT NOT NULL,
    "salesNama" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELESAI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Penjualan_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Penjualan_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PenjualanItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "penjualanId" INTEGER NOT NULL,
    "produkId" INTEGER NOT NULL,
    "namaBarang" TEXT NOT NULL,
    "hargaSatuan" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    CONSTRAINT "PenjualanItem_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PenjualanItem_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cicilan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "penjualanId" INTEGER NOT NULL,
    "cicilanKe" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "tanggalJatuhTempo" DATETIME NOT NULL,
    "tanggalBayar" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    CONSTRAINT "Cicilan_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Penjualan_nomorTransaksi_key" ON "Penjualan"("nomorTransaksi");

-- CreateIndex
CREATE UNIQUE INDEX "Cicilan_penjualanId_cicilanKe_key" ON "Cicilan"("penjualanId", "cicilanKe");
