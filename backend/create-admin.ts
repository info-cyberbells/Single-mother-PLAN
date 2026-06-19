import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'aman.cyberbells@gmail.com';
  const plainPassword = '#Aman@2001';
  const password_hash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash,
      role: 'admin',
    },
    create: {
      email,
      password_hash,
      full_name: 'Aman (Admin)',
      role: 'admin',
    },
  });
  console.log('Admin user created/updated:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
