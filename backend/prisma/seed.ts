import { PrismaClient, Role, ResponderType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("ChangeMe123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@eveshield.org" },
    update: {},
    create: {
      fullName: "Edith Karanja",
      email: "admin@eveshield.org",
      passwordHash: password,
      role: Role.ORG_ADMIN,
      organization: "EveShield HQ",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@eveshield.org" },
    update: {},
    create: {
      fullName: "Rooney Wesley",
      email: "operator@eveshield.org",
      passwordHash: password,
      role: Role.ORG_OPERATOR,
      organization: "EveShield HQ",
    },
  });

  const policeUser = await prisma.user.upsert({
    where: { email: "police@eveshield.org" },
    update: {},
    create: {
      fullName: "Officer Wanjiru",
      email: "police@eveshield.org",
      passwordHash: password,
      role: Role.POLICE,
      organization: "Nairobi Central Police",
    },
  });

  const medicalUser = await prisma.user.upsert({
    where: { email: "medic@eveshield.org" },
    update: {},
    create: {
      fullName: "Nurse Mumbi",
      email: "medic@eveshield.org",
      passwordHash: password,
      role: Role.MEDICAL,
      organization: "St. Jude Ambulance Services",
    },
  });

  await prisma.responder.upsert({
    where: { userId: policeUser.id },
    update: {},
    create: { userId: policeUser.id, type: ResponderType.POLICE, badgeNumber: "PD-4471", unit: "Patrol Unit 12" },
  });

  await prisma.responder.upsert({
    where: { userId: medicalUser.id },
    update: {},
    create: { userId: medicalUser.id, type: ResponderType.MEDICAL, unit: "Ambulance 7" },
  });

  console.log("Seed complete. Demo login password for all accounts: ChangeMe123!");
  console.log({ admin: admin.email, operator: operator.email, police: policeUser.email, medic: medicalUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
