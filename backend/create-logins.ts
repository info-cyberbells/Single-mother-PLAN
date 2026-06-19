import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Admin Login (for port 3001)
  const adminEmail = 'aman.cyberbells@gmail.com';
  const adminPassword = '#Aman@2001';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password_hash: adminHash,
      role: 'admin',
    },
    create: {
      email: adminEmail,
      password_hash: adminHash,
      full_name: 'Aman (Admin)',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created/updated:', adminUser.email, 'with password:', adminPassword);

  // 2. Regular User Login (for port 3000)
  const userEmail = 'user@momplan.com';
  const userPassword = '#User@2026';
  const userHash = await bcrypt.hash(userPassword, 10);

  const regularUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      password_hash: userHash,
      role: 'user',
    },
    create: {
      email: userEmail,
      password_hash: userHash,
      full_name: 'Jane Doe (User)',
      role: 'user',
      plan: 'free',
    },
  });
  console.log('✅ Regular user created/updated:', regularUser.email, 'with password:', userPassword);

  // 3. Counselor Login
  const counselorEmail = 'counselor@momplan.com';
  const counselorPassword = '#Counselor@2026';
  const counselorHash = await bcrypt.hash(counselorPassword, 10);

  const counselorUser = await prisma.user.upsert({
    where: { email: counselorEmail },
    update: {
      password_hash: counselorHash,
      role: 'counselor',
    },
    create: {
      email: counselorEmail,
      password_hash: counselorHash,
      full_name: 'Counselor (Demo)',
      role: 'counselor',
    },
  });
  console.log('✅ Counselor created/updated:', counselorUser.email, 'with password:', counselorPassword);
}

main()
  .catch(e => {
    console.error('💥 Error creating logins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
