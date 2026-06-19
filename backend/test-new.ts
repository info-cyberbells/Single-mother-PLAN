import { PrismaClient } from '@prisma/client';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

async function testConnection(url: string, name: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    await prisma.$connect();
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log(`✅ SUCCESS! Connected using ${name}. Result:`, res);
    return true;
  } catch (err: any) {
    console.log(`❌ FAILED: ${name} -> Error: ${err.message.split('\n')[0]}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const pwd = "#SupaBase@2026";
  const encodedPwd = encodeURIComponent(pwd);
  const ref = "knbjwnechjfxbvknacpq";
  const region = "ap-northeast-2";
  
  const urls = [
    { url: `postgresql://postgres.${ref}:${encodedPwd}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`, name: "aws-0 Pooler 6543" },
    { url: `postgresql://postgres.${ref}:${encodedPwd}@aws-0-${region}.pooler.supabase.com:5432/postgres`, name: "aws-0 Pooler 5432" },
    { url: `postgresql://postgres.${ref}:${encodedPwd}@aws-1-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`, name: "aws-1 Pooler 6543" },
    { url: `postgresql://postgres.${ref}:${encodedPwd}@aws-1-${region}.pooler.supabase.com:5432/postgres`, name: "aws-1 Pooler 5432" },
    { url: `postgresql://postgres:${encodedPwd}@db.${ref}.supabase.co:5432/postgres`, name: "Direct IP" }
  ];

  for (const item of urls) {
    const success = await testConnection(item.url, item.name);
    if (success) {
      console.log(`🎉 Found working connection for project ${ref}: ${item.name}`);
      return;
    }
  }
  
  console.log("All connections to project failed!");
}

main();





