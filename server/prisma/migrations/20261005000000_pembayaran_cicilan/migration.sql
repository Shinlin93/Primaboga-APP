-- AlterTable
ALTER TABLE "Cicilan" ADD COLUMN "terbayar" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "penjualanId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlah" INTEGER NOT NULL,
    "catatan" TEXT,
    "cicilanDari" INTEGER NOT NULL,
    "cicilanSampai" INTEGER NOT NULL,
    "totalTerbayarSetelah" INTEGER NOT NULL,
    "sisaPiutangSetelah" INTEGER NOT NULL,
    "tunggakanSetelah" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pembayaran_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Pembayaran_penjualanId_idx" ON "Pembayaran"("penjualanId");

-- Migrasi data lama: cicilan yang sudah LUNAS dianggap terbayar penuh
UPDATE "Cicilan" SET "terbayar" = "nominal" WHERE "status" = 'LUNAS';

-- Buat catatan Pembayaran untuk setiap cicilan LUNAS yang sudah ada (satu cicilan = satu pembayaran)
INSERT INTO "Pembayaran" ("penjualanId", "tanggal", "jumlah", "cicilanDari", "cicilanSampai", "totalTerbayarSetelah", "sisaPiutangSetelah", "tunggakanSetelah")
SELECT
    c."penjualanId",
    COALESCE(c."tanggalBayar", c."tanggalJatuhTempo"),
    c."nominal",
    c."cicilanKe",
    c."cicilanKe",
    (SELECT COALESCE(SUM(x."nominal"), 0) FROM "Cicilan" x
       WHERE x."penjualanId" = c."penjualanId" AND x."status" = 'LUNAS' AND x."cicilanKe" <= c."cicilanKe"),
    (SELECT COALESCE(SUM(y."nominal"), 0) FROM "Cicilan" y WHERE y."penjualanId" = c."penjualanId")
      - (SELECT COALESCE(SUM(x."nominal"), 0) FROM "Cicilan" x
           WHERE x."penjualanId" = c."penjualanId" AND x."status" = 'LUNAS' AND x."cicilanKe" <= c."cicilanKe"),
    0
FROM "Cicilan" c
WHERE c."status" = 'LUNAS'
ORDER BY c."penjualanId", c."cicilanKe";
