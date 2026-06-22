/**
 * Sample referral data for the Blossom Community Hub org so the Referrals
 * dashboard (stats, network, list, accept/decline) has something to show.
 *
 * Creates a mix of SENT and RECEIVED referrals across real partner orgs, with
 * varied statuses (pending / accepted / declined) and outcomes (success / fail).
 *
 * Idempotent: deletes referrals touching Blossom, then recreates them.
 * Run with:  npx tsx prisma/seed_referrals.ts
 */
import 'dotenv/config';
import { prisma } from '../src/config/prisma';

const ORG_ID = '00000000-0000-0000-0000-000000000001'; // Blossom Community Hub

function uid(n: number): string {
  return `000000c8-0000-4000-8000-0000${n.toString(16).padStart(8, '0')}`;
}
const daysAgo = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x;
};
const plusHours = (date: Date, h: number) => new Date(date.getTime() + h * 3_600_000);

interface Plan {
  org: number;       // index into target orgs
  caseI: number;     // index into org cases
  status: 'pending' | 'accepted' | 'declined';
  outcome?: 'success' | 'fail';
  createdDaysAgo: number;
  respHrs?: number;  // response time for accepted/declined
}

const SENT: Plan[] = [
  { org: 0, caseI: 0, status: 'pending', createdDaysAgo: 2 },
  { org: 1, caseI: 1, status: 'pending', createdDaysAgo: 4 },
  { org: 2, caseI: 2, status: 'accepted', outcome: 'success', createdDaysAgo: 20, respHrs: 20 },
  { org: 3, caseI: 3, status: 'accepted', createdDaysAgo: 12, respHrs: 5 },
  { org: 0, caseI: 4, status: 'declined', createdDaysAgo: 15, respHrs: 40 },
  { org: 1, caseI: 5, status: 'accepted', outcome: 'fail', createdDaysAgo: 25, respHrs: 12 },
];
const RECEIVED: Plan[] = [
  { org: 2, caseI: 6, status: 'pending', createdDaysAgo: 1 },
  { org: 3, caseI: 7, status: 'pending', createdDaysAgo: 3 },
  { org: 4, caseI: 8, status: 'accepted', outcome: 'success', createdDaysAgo: 10, respHrs: 8 },
  { org: 0, caseI: 9, status: 'declined', createdDaysAgo: 18, respHrs: 30 },
];

async function main() {
  // Reference data
  const admin = await prisma.orgUser.findFirst({
    where: { org_id: ORG_ID, role: 'admin' },
    select: { id: true },
  });

  const cases = await prisma.partnerCase.findMany({
    where: { OR: [{ caseworker: { org_id: ORG_ID } }, { mother: { user: { org_id: ORG_ID } } }] },
    select: { id: true },
    take: 20,
    orderBy: { created_at: 'desc' },
  });
  if (cases.length === 0) {
    console.error('No cases found for Blossom org — cannot create referrals (referrals need a case).');
    return;
  }

  const targetOrgs = await prisma.organization.findMany({
    where: { active: true, id: { not: ORG_ID } },
    select: { id: true },
    take: 5,
    orderBy: { org_name: 'asc' },
  });
  if (targetOrgs.length === 0) {
    console.error('No other organizations found — cannot create org-to-org referrals.');
    return;
  }

  const caseId = (i: number) => cases[i % cases.length].id;
  const orgId = (i: number) => targetOrgs[i % targetOrgs.length].id;

  // Idempotent: remove referrals touching Blossom
  await prisma.referral.deleteMany({
    where: { OR: [{ from_org_id: ORG_ID }, { to_org_id: ORG_ID }] },
  });

  let n = 1;
  const create = async (p: Plan, direction: 'sent' | 'received') => {
    const created_at = daysAgo(p.createdDaysAgo);
    const responded_at =
      p.status === 'pending' ? null : plusHours(created_at, p.respHrs ?? 6);
    await prisma.referral.create({
      data: {
        id: uid(n++),
        case_id: caseId(p.caseI),
        from_org_id: direction === 'sent' ? ORG_ID : orgId(p.org),
        to_org_id: direction === 'sent' ? orgId(p.org) : ORG_ID,
        referred_by: direction === 'sent' ? admin?.id ?? null : null,
        status: p.status,
        outcome: p.outcome ?? null,
        notes: direction === 'sent' ? 'Referred for additional support services.' : 'Incoming referral from partner org.',
        created_at,
        responded_at,
      },
    });
  };

  for (const p of SENT) await create(p, 'sent');
  for (const p of RECEIVED) await create(p, 'received');

  console.log('✅ Sample referrals seeded for Blossom Community Hub');
  console.log(`   Sent: ${SENT.length}  ·  Received: ${RECEIVED.length}  ·  Partner orgs used: ${targetOrgs.length}`);
}

main()
  .catch((e) => {
    console.error('Referral seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
