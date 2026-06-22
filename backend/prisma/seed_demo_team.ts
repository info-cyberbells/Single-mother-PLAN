/**
 * Demo data generator for the Blossom Community Hub partner org.
 *
 * Populates a realistic team + caseload so the Team Overview and Program
 * Performance dashboards show the full range of states (overloaded / at-risk /
 * healthy caseworkers, rebalancing suggestions, approvals, denials with reasons,
 * and quarter-over-quarter trends).
 *
 * Idempotent: re-running deletes the previously generated demo mothers/cases
 * (cascades to their cases, outcomes, deadlines, documents, communications)
 * and recreates them. Run with:  npx tsx prisma/seed_demo_team.ts
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';

const ORG_ID = '00000000-0000-0000-0000-000000000001'; // Blossom Community Hub
const YEAR = new Date().getFullYear();

// Deterministic UUID builder (distinct namespace per entity kind)
function uid(kind: number, n: number): string {
  const k = kind.toString(16).padStart(2, '0');
  const hex = n.toString(16).padStart(8, '0');
  return `000000${k}-0000-4000-8000-0000${hex}`;
}

const intake = (quarter: 'Q1' | 'Q2', dayOffset: number) =>
  quarter === 'Q2' ? new Date(YEAR, 4, 1 + dayOffset) : new Date(YEAR, 1, 1 + dayOffset);

const daysFromNow = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x;
};

const ACTIVE_NON_RENEWAL = ['submitted', 'in_progress', 'not_started', 'submitted', 'in_progress'];
const DENIAL_REASONS = [
  'Missing income verification',
  'Missing income verification',
  'Residency documentation',
  'Work-requirement docs',
  'Income over threshold',
  'Missed interview',
];

interface QuarterPlan {
  active: number;
  approved: number;
  denied: number;
  renewals: number;
  docsOverdue: number;
}

interface WorkerPlan {
  idx: number;
  name: string;
  email: string;
  capacity: number;
  programs: string[];
  responseH: number;
  q2: QuarterPlan;
  q1: QuarterPlan;
}

const WORKERS: WorkerPlan[] = [
  { idx: 1, name: 'M. Thompson', email: 'mthompson@blossomcommunityhub.org', capacity: 8, programs: ['snap', 'medicaid', 'wic'], responseH: 7.2,
    q2: { active: 9, approved: 3, denied: 2, renewals: 3, docsOverdue: 2 }, q1: { active: 7, approved: 2, denied: 3, renewals: 2, docsOverdue: 1 } },
  { idx: 2, name: 'R. Okafor', email: 'rokafor@blossomcommunityhub.org', capacity: 8, programs: ['medicaid', 'ccdf', 'wic'], responseH: 5.8,
    q2: { active: 8, approved: 4, denied: 1, renewals: 2, docsOverdue: 1 }, q1: { active: 7, approved: 3, denied: 1, renewals: 1, docsOverdue: 1 } },
  { idx: 3, name: 'L. Santana', email: 'lsantana@blossomcommunityhub.org', capacity: 8, programs: ['ccdf', 'snap', 'medicaid'], responseH: 5.1,
    q2: { active: 6, approved: 3, denied: 2, renewals: 1, docsOverdue: 2 }, q1: { active: 6, approved: 3, denied: 1, renewals: 1, docsOverdue: 1 } },
  { idx: 4, name: 'D. Nguyen', email: 'dnguyen@blossomcommunityhub.org', capacity: 8, programs: ['tanf', 'wic', 'snap'], responseH: 4.2,
    q2: { active: 5, approved: 5, denied: 0, renewals: 0, docsOverdue: 0 }, q1: { active: 5, approved: 4, denied: 0, renewals: 0, docsOverdue: 0 } },
  { idx: 5, name: 'P. Kimani', email: 'pkimani@blossomcommunityhub.org', capacity: 8, programs: ['wic', 'medicaid'], responseH: 6.8,
    q2: { active: 4, approved: 2, denied: 1, renewals: 1, docsOverdue: 1 }, q1: { active: 3, approved: 2, denied: 1, renewals: 0, docsOverdue: 0 } },
  { idx: 6, name: 'J. Walsh', email: 'jwalsh@blossomcommunityhub.org', capacity: 4, programs: ['wic', 'ccdf'], responseH: 3.1,
    q2: { active: 2, approved: 3, denied: 0, renewals: 0, docsOverdue: 0 }, q1: { active: 2, approved: 2, denied: 0, renewals: 0, docsOverdue: 0 } },
];

async function main() {
  const password_hash = await bcrypt.hash('Admin1234!', 10);
  const workerIds = WORKERS.map((w) => uid(1, w.idx));

  // 1. Upsert caseworkers
  for (const w of WORKERS) {
    const id = uid(1, w.idx);
    await prisma.orgUser.upsert({
      where: { id },
      update: { full_name: w.name, caseload_capacity: w.capacity, is_active: true, role: 'caseworker', org_id: ORG_ID },
      create: {
        id, full_name: w.name, email: w.email, password_hash,
        role: 'caseworker', org_id: ORG_ID, is_active: true, caseload_capacity: w.capacity, must_change_password: false,
      },
    });
  }

  // 2. Clean previously generated demo mothers (cascades to cases + children)
  await prisma.mother.deleteMany({ where: { caseworker_id: { in: workerIds } } });

  // 3. Deactivate the original two demo caseworkers for a clean 6-worker team view
  await prisma.orgUser.updateMany({
    where: {
      org_id: ORG_ID,
      role: 'caseworker',
      id: { in: ['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'] },
    },
    data: { is_active: false },
  });

  // 4. Generate cases
  let motherN = 1;
  let caseN = 1;
  let outcomeN = 1;
  let deadlineN = 1;
  let docN = 1;
  let commN = 1;
  let denialCycle = 0;
  let approvedCases = 0;
  let deniedCases = 0;
  let totalCases = 0;

  for (const w of WORKERS) {
    const cwId = uid(1, w.idx);

    for (const quarter of ['Q2', 'Q1'] as const) {
      const plan = quarter === 'Q2' ? w.q2 : w.q1;
      let progIdx = 0;
      const nextProgram = () => w.programs[progIdx++ % w.programs.length];

      // Build the status list for active cases
      const activeStatuses: string[] = [];
      for (let i = 0; i < plan.renewals; i++) activeStatuses.push('renewal_due');
      for (let i = activeStatuses.length; i < plan.active; i++)
        activeStatuses.push(ACTIVE_NON_RENEWAL[i % ACTIVE_NON_RENEWAL.length]);

      let docsLeft = plan.docsOverdue;
      let firstCaseId: string | null = null;

      const makeCase = async (status: string, opts: { renewal?: boolean; outcome?: 'approved' | 'denied' }) => {
        const motherId = uid(2, motherN++);
        const caseId = uid(3, caseN++);
        if (!firstCaseId) firstCaseId = caseId;
        const program = nextProgram();
        const intakeDate = intake(quarter, (caseN % 25) + 1);

        await prisma.mother.create({
          data: { id: motherId, caseworker_id: cwId, enrollment_status: 'enrolled', address: 'Atlanta, GA' },
        });
        await prisma.partnerCase.create({
          data: {
            id: caseId, mother_id: motherId, caseworker_id: cwId, program_id: program,
            status, quarter, urgency_level: status === 'renewal_due' ? 'high' : 'normal',
            intake_date: intakeDate, last_activity: new Date(),
          },
        });
        totalCases++;

        if (opts.outcome) {
          const decidedAt = new Date(intakeDate);
          decidedAt.setDate(decidedAt.getDate() + 12 + (caseN % 10));
          const reason = opts.outcome === 'denied' ? DENIAL_REASONS[denialCycle++ % DENIAL_REASONS.length] : null;
          await prisma.caseOutcome.create({
            data: {
              id: uid(4, outcomeN++), case_id: caseId, result: opts.outcome,
              denial_reason: reason, decided_at: decidedAt,
              benefit_amount_usd: opts.outcome === 'approved' ? 250 : null,
            },
          });
          if (opts.outcome === 'approved') approvedCases++;
          else deniedCases++;
        }

        if (opts.renewal) {
          await prisma.caseDeadline.create({
            data: { id: uid(5, deadlineN++), case_id: caseId, type: 'renewal', due_date: daysFromNow(5 + (caseN % 20)), is_resolved: false },
          });
        }

        if (docsLeft > 0 && quarter === 'Q2') {
          await prisma.caseDocument.create({
            data: { id: uid(6, docN++), case_id: caseId, doc_type: 'proof_of_income', file_url: '', review_status: 'pending' },
          });
          docsLeft--;
        }
        return caseId;
      };

      // Active cases
      for (const st of activeStatuses) await makeCase(st, { renewal: st === 'renewal_due' });
      // Approved (terminal)
      for (let i = 0; i < plan.approved; i++) await makeCase('approved', { outcome: 'approved' });
      // Denied (terminal)
      for (let i = 0; i < plan.denied; i++) await makeCase('denied', { outcome: 'denied' });

      // Communications with a response gap → drives avg response time (Q2 only)
      if (quarter === 'Q2' && firstCaseId) {
        for (let i = 0; i < 2; i++) {
          const sentAt = new Date(YEAR, 4, 10 + i);
          const respondedAt = new Date(sentAt.getTime() + w.responseH * 3_600_000);
          await prisma.communication.create({
            data: {
              id: uid(7, commN++), case_id: firstCaseId, sent_by: cwId, type: 'reminder', channel: 'email',
              message: 'Document reminder sent to client', sent_at: sentAt, responded_at: respondedAt, delivery_status: 'delivered',
            },
          });
        }
      }
    }
  }

  console.log('✅ Demo team data seeded for Blossom Community Hub');
  console.log(`   Caseworkers: ${WORKERS.length} (original 2 demo caseworkers deactivated)`);
  console.log(`   Cases: ${totalCases}  ·  Approved: ${approvedCases}  ·  Denied: ${deniedCases}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
