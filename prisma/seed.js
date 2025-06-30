import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@trashvalue.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@trashvalue.com",
      phone: "081234567890",
      password: hashedPassword,
      address: "TrashValue Headquarters",
      role: "ADMIN",
    },
  });

  console.log(`Created admin user: ${admin.name}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
