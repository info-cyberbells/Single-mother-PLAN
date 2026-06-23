/**
 * Sample referral data for the Blossom Community Hub org so the Referrals page,
 * the Referral Network Map, and the Partners-by-Zip-&-Type directory all have a
 * rich, realistic dataset.
 *
 * Generates ~12 partner organizations with varied direction (inbound/outbound),
 * volume, acceptance, and outcome rates within the current quarter.
 *
 * Idempotent: deletes referrals touching Blossom, then recreates them.
 * Run with:  npx tsx prisma/seed_referrals.ts
 */
import 'dotenv/config';
import { prisma } from '../src/config/prisma';

const ORG_ID = '00000000-0000-0000-0000-000000000001'; // Blossom Community Hub

let counter = 1;
function uid(): string {
  return `000000c8-0000-4000-8000-0000${(counter++).toString(16).padStart(8, '0')}`;
}
const daysAgo = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x;
};
const plusHours = (date: Date, h: number) => new Date(date.getTime() + h * 3_600_000);

interface PartnerPlan {
  dir: 'in' | 'out';
  volume: number;
  accFrac: number;   // share of decided that are accepted
  outcomeFrac: number; // share of accepted with success outcome
  respHrs: number;
}

const PLANS: PartnerPlan[] = [
  { dir: 'in', volume: 8, accFrac: 0.9, outcomeFrac: 0.8, respHrs: 20 },
  { dir: 'in', volume: 6, accFrac: 0.85, outcomeFrac: 0.75, respHrs: 18 },
  { dir: 'in', volume: 5, accFrac: 0.8, outcomeFrac: 0.7, respHrs: 10 },
  { dir: 'in', volume: 4, accFrac: 0.7, outcomeFrac: 0.6, respHrs: 24 },
  { dir: 'in', volume: 2, accFrac: 0.55, outcomeFrac: 0.5, respHrs: 40 },
  { dir: 'in', volume: 4, accFrac: 0.9, outcomeFrac: 0.85, respHrs: 8 },
  { dir: 'out', volume: 7, accFrac: 0.92, outcomeFrac: 0.8, respHrs: 6 },
  { dir: 'out', volume: 5, accFrac: 0.83, outcomeFrac: 0.7, respHrs: 12 },
  { dir: 'out', volume: 4, accFrac: 0.64, outcomeFrac: 0.5, respHrs: 30 },
  { dir: 'out', volume: 3, accFrac: 0.85, outcomeFrac: 0.75, respHrs: 9 },
  { dir: 'out', volume: 2, accFrac: 0.6, outcomeFrac: 0.55, respHrs: 36 },
  { dir: 'out', volume: 3, accFrac: 0.88, outcomeFrac: 0.78, respHrs: 14 },
];

async function main() {
  const admin = await prisma.orgUser.findFirst({ where: { org_id: ORG_ID, role: 'admin' }, select: { id: true } });

  const cases = await prisma.partnerCase.findMany({
    where: { OR: [{ caseworker: { org_id: ORG_ID } }, { mother: { user: { org_id: ORG_ID } } }] },
    select: { id: true },
    take: 30,
    orderBy: { created_at: 'desc' },
  });
  if (cases.length === 0) return console.error('No Blossom cases found — referrals need a case.');

  const targetOrgs = await prisma.organization.findMany({
    where: { active: true, id: { not: ORG_ID } },
    select: { id: true },
    take: PLANS.length,
    orderBy: { org_name: 'asc' },
  });
  if (targetOrgs.length < PLANS.length) console.warn(`Only ${targetOrgs.length} partner orgs available.`);

  const caseId = (i: number) => cases[i % cases.length].id;

  // Idempotent reset
  await prisma.referral.deleteMany({ where: { OR: [{ from_org_id: ORG_ID }, { to_org_id: ORG_ID }] } });

  let made = 0;
  let ci = 0;

  for (let k = 0; k < Math.min(PLANS.length, targetOrgs.length); k++) {
    const p = PLANS[k];
    const partnerId = targetOrgs[k].id;
    const accepted = Math.round(p.volume * p.accFrac);
    const declined = p.volume - accepted;
    const success = Math.round(accepted * p.outcomeFrac);

    for (let i = 0; i < p.volume; i++) {
      const isAccepted = i < accepted;
      const isDeclined = !isAccepted && i < accepted + declined;
      const status = isAccepted ? 'accepted' : isDeclined ? 'declined' : 'pending';
      const outcome = isAccepted ? (i < success ? 'success' : 'fail') : null;
      const created = daysAgo(3 + ((i * 7 + k * 3) % 55)); // within ~last 2 months (current quarter)
      const responded = status === 'pending' ? null : plusHours(created, p.respHrs);

      await prisma.referral.create({
        data: {
          id: uid(),
          case_id: caseId(ci++),
          from_org_id: p.dir === 'in' ? partnerId : ORG_ID,
          to_org_id: p.dir === 'in' ? ORG_ID : partnerId,
          referred_by: p.dir === 'out' ? admin?.id ?? null : null,
          status,
          outcome,
          notes: p.dir === 'in' ? 'Incoming referral from partner org.' : 'Referred for additional support services.',
          created_at: created,
          responded_at: responded,
        },
      });
      made++;
    }
  }

  console.log('✅ Referral network seeded for Blossom Community Hub');
  console.log(`   Partners: ${Math.min(PLANS.length, targetOrgs.length)}  ·  Referrals: ${made}  (inbound + outbound mix)`);
}

main()
  .catch((e) => { console.error('Referral seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
