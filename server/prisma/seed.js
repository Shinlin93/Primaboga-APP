const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.produk.createMany({
    data: [
      { nama: "Kompor Stainless", harga: 2000000 },
      { nama: "Panci Belly Pot", harga: 1500000 },
      { nama: "Wajan Anti Lengket 30cm", harga: 750000 },
      { nama: "Dandang Kukus Besar", harga: 900000 },
    ],
  });

  await prisma.sales.createMany({
    data: [
      { nama: "Andi", hp: "0813-1111-2222" },
      { nama: "Sari", hp: "0814-3333-4444" },
    ],
  });

  await prisma.pelanggan.createMany({
    data: [
      { nama: "Budi Santoso", alamat: "Jl. Merdeka No. 12, Surabaya", hp: "0812-3456-7890" },
    ],
  });

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
