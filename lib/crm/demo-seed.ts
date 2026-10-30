import "server-only";

import { randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/db";

import { DEMO_AGENCY, DEMO_EMAIL, DEMO_SUB, withDemoWrites } from "./demo";
import { nextNumber, refreshInvoice } from "./invoices";
import { refreshTotals } from "./quotes";
import { inWorkspace } from "./request-workspace";
import { templateFor } from "./stages";

/**
 * NOVA'S DEMO AGENCY (lib/crm/demo): "Northstar Collective" with its own CRM,
 * filled with made-up leads, creators, a plan, a quote, invoices, projects
 * and tasks. Every name, email (.example) and number is invented, so the live
 * demo shows the real CRM without one real client. Made once, the first time
 * anyone opens /demo (and by scripts/nova-demo-seed.mts locally). Every
 * record names its CRM itself too, on top of inWorkspace: a demo record left
 * in Genesis's CRM would show to Genesis's team.
 */
const BRAND_EMAIL = "aditi@bloomfield.example";
const MEMBER_EMAIL = "kabir@northstar.example";

export const demoAgency = () => getPrisma().account.findFirst({ where: { name: DEMO_AGENCY, crmWorkspace: true, workspaceId: null }, select: { id: true } });

/** Makes the demo agency unless it's there. Two first visitors at once make it once (a lock row). */
export async function ensureDemo() {
  if (await demoAgency()) return;
  await withDemoWrites(async () => {
    const prisma = getPrisma();
    const lock = await prisma.appSetting.create({ data: { key: "nova-demo:seeding", value: new Date().toISOString() } }).catch(() => null);
    if (!lock) return;
    try {
      if (!(await demoAgency())) await seedDemo();
    } finally {
      await prisma.appSetting.delete({ where: { key: "nova-demo:seeding" } }).catch(() => undefined);
    }
  });
}

/** Removes the demo agency and everything in it. */
export async function removeDemo() {
  await withDemoWrites(async () => {
    const prisma = getPrisma();
    const existing = await demoAgency();
    if (!existing) return;
    const ws = existing.id;
    for (const m of ["task", "invoice", "quote", "project", "creator", "lead", "brief", "request"] as const) await (prisma[m] as unknown as { deleteMany: (a: object) => Promise<unknown> }).deleteMany({ where: { workspaceId: ws } });
    await prisma.account.deleteMany({ where: { workspaceId: ws } });
    await prisma.user.deleteMany({ where: { email: { in: [DEMO_EMAIL, BRAND_EMAIL, MEMBER_EMAIL] } } });
    await prisma.account.delete({ where: { id: ws } });
  });
}

async function seedDemo() {
  const prisma = getPrisma();
  let out: Record<string, string> = {};
  const day = (n: number) => new Date(Date.now() + n * 864e5);
  const date = (n: number) => new Date(day(n).toISOString().slice(0, 10));
  const rs = (r: number) => r * 100;

  const agency = await prisma.account.create({ data: { name: DEMO_AGENCY, kind: "AGENCY", status: "ACTIVE", crmWorkspace: true, workspaceId: null, city: "Mumbai", crmProfile: { name: DEMO_AGENCY, legalName: "Northstar Collective LLP", gstin: "27AAQFN1234K1Z2", address: "4th Floor, Lotus Court, Bandra West, Mumbai 400050", email: "hello@northstar.example", phone: "+91 90000 12345", invoicePrefix: "NSC/", payee: "Northstar Collective LLP", bank: "HDFC Bank", account: "50200012345678", ifsc: "HDFC0000123" } } });
  const ws = agency.id;
  const riya = await prisma.user.create({ data: { auth0Sub: DEMO_SUB, email: DEMO_EMAIL, name: "Riya Kapoor", emailVerified: true, workspaceId: ws, workspaceRole: "ADMIN" } });
  const kabir = await prisma.user.create({ data: { auth0Sub: "demo|nova-member", email: "kabir@northstar.example", name: "Kabir Shah", emailVerified: true, workspaceId: ws, workspaceRole: "MEMBER" } });
  const brandUser = await prisma.user.create({ data: { auth0Sub: "demo|nova-brand", email: BRAND_EMAIL, name: "Aditi Rao", emailVerified: true } });

  await inWorkspace(ws, async () => {
    const bloom = await prisma.account.create({ data: { workspaceId: ws, name: "Bloomfield Organics", legalName: "Bloomfield Organics Pvt Ltd", gstin: "27AABCB4321M1Z9", email: "marketing@bloomfield.example", city: "Mumbai", state: "Maharashtra", industry: "D2C food", status: "ACTIVE", managerId: riya.id } });
    const tide = await prisma.account.create({ data: { workspaceId: ws, name: "Tidewater Apparel", email: "brand@tidewater.example", industry: "Fashion", city: "Bengaluru", status: "ACTIVE", managerId: kabir.id } });
    const nimbus = await prisma.account.create({ data: { workspaceId: ws, name: "Nimbus Fitness", email: "hello@nimbusfit.example", industry: "Fitness", city: "Pune", status: "ACTIVE", managerId: riya.id } });
    await prisma.accountMember.create({ data: { accountId: bloom.id, userId: brandUser.id, role: "OWNER" } });
    /* The admin can open Bloomfield's client portal too, to see what a brand sees. */
    await prisma.accountMember.create({ data: { accountId: bloom.id, userId: riya.id, role: "MEMBER" } });

    const leads = [
      ["Neha Joshi", "Saffron Street Café", "INFLUENCE", "Launch campaign, 10 creators", "INSTAGRAM", "NEW", 180000, 0, riya],
      ["Arjun Menon", "Voltride EV", "STUDIOS", "Product film", "LINKEDIN", "CONTACTED", 350000, 1, kabir],
      ["Sana Qureshi", "Lumen Skin", "INFLUENCE", "UGC pack, 12 reels", "REFERRAL", "QUALIFIED", 240000, -1, riya],
      ["Vikram Rao", "Harbour Homes", "BRAND_DESIGN", "Brand refresh", "WEBSITE_FORM", "CALL_BOOKED", 150000, 2, kabir],
      ["Meera Pillai", "Nimbus Fitness", "INFLUENCE", "Monsoon challenge", "WEBSITE_FORM", "PROPOSAL_SENT", 420000, 3, riya],
      ["Rahul Batra", "Tidewater Apparel", "INFLUENCE", "Festive edit with creators", "PARTNER", "NEGOTIATION", 560000, 0, kabir],
      ["Aditi Rao", "Bloomfield Organics", "INFLUENCE", "Always-on creators", "REFERRAL", "WON", 300000, 0, riya],
    ] as const;
    for (const [name, company, division, interest, source, status, value, follow, owner] of leads) {
      const lead = await prisma.lead.create({ data: { workspaceId: ws, name, company, division, interest, source, status, valuePaise: rs(value), email: `${name.split(" ")[0]!.toLowerCase()}@${company.toLowerCase().replace(/\W+/g, "")}.example`, ownerId: owner.id, createdById: owner.id, nextFollowUp: status === "WON" ? null : date(follow), accountId: status === "WON" ? bloom.id : null } });
      await prisma.activity.create({ data: { leadId: lead.id, kind: "NOTE", actorId: owner.id, body: `First call: ${interest.toLowerCase()}.` } });
    }

    const creators = [
      ["Anaya Kulkarni", "anaya.everyday", 214000, 4.3, ["Food", "Lifestyle"], "Mumbai", 42000],
      ["Dhruv Malhotra", "dhruv.moves", 88000, 5.8, ["Fitness"], "Delhi", 18000],
      ["Zoya Sheikh", "zoyaeats.in", 392000, 3.4, ["Food"], "Hyderabad", 70000],
      ["Ishaan Nair", "ishaan.builds", 640000, 2.9, ["Tech", "Lifestyle"], "Bengaluru", 120000],
      ["Kiara Bhatt", "kiara.threads", 46000, 6.9, ["Fashion"], "Ahmedabad", 12000],
      ["Rohan Dutta", "rohan.trails", 129000, 4.8, ["Travel", "Fitness"], "Kolkata", 26000],
    ] as const;
    const tier = (f: number) => (f >= 5e5 ? "MACRO" : f >= 1e5 ? "MID" : f >= 1e4 ? "MICRO" : "NANO");
    const made = [];
    for (const [name, handle, followers, er, niches, city, reel] of creators) made.push(await prisma.creator.create({ data: { workspaceId: ws, name, handle, followers, avgViews: Math.round(followers * 0.38), engagementRate: er, niches: [...niches], city, reelRatePaise: rs(reel), storyRatePaise: rs(Math.round(reel / 4)), tier: tier(followers), languages: ["Hindi", "English"], createdById: riya.id } }));

    const plan = await prisma.quote.create({
      data: {
        workspaceId: ws, token: randomBytes(12).toString("hex"), kind: "INFLUENCER_PLAN", status: "SENT", title: "Nimbus Fitness — Monsoon Challenge Influencer Plan", division: "INFLUENCE", accountId: nimbus.id,
        contactName: "Meera Pillai", contactEmail: "meera@nimbusfit.example", company: "Nimbus Fitness", issuedAt: day(-2), sentAt: day(-2), viewedAt: day(-1), expiresAt: date(12), addGst: true, gstPercent: 18, markupPercent: 20, createdById: riya.id,
        lines: { create: [{ position: 0, kind: "custom", division: "INFLUENCE", title: "Campaign strategy & management", subtitle: "Briefs, approvals, posting and report", qty: 1, unitPaise: rs(40000) }] },
        creators: { create: made.slice(0, 5).map((c, i) => ({ position: i, creatorId: c.id, name: c.name, handle: c.handle, platform: c.platform, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, deliverables: "1 reel + 2 stories", feePaise: c.reelRatePaise })) },
      },
    });
    await refreshTotals(plan.id);
    const quote = await prisma.quote.create({
      data: {
        workspaceId: ws, token: randomBytes(12).toString("hex"), kind: "QUOTE", status: "ACCEPTED", title: "Bloomfield Organics — Always-on Creator Content (Q4)", division: "INFLUENCE", accountId: bloom.id,
        contactName: "Aditi Rao", contactEmail: BRAND_EMAIL, company: "Bloomfield Organics", issuedAt: day(-9), sentAt: day(-9), acceptedAt: day(-6), acceptedBy: "Aditi Rao", expiresAt: date(5), addGst: true, gstPercent: 18, createdById: riya.id,
        lines: { create: [
          { position: 0, kind: "custom", division: "INFLUENCE", title: "Creator content | 12 reels a month", subtitle: "Sourcing, briefs and approvals", qty: 3, unitPaise: rs(65000), details: "12 creator reels a month\nCreator shortlisting and briefs\nTwo rounds of feedback\nUsage rights for 3 months" },
          { position: 1, kind: "custom", division: "STUDIOS", title: "Editing & paid-ready cuts", subtitle: "Post-production", qty: 3, unitPaise: rs(25000), details: "Hooks and supers\n9:16 and 4:5 exports\nPaid-media ready" },
        ] },
      },
    });
    await refreshTotals(quote.id);

    for (const [i, status, days] of [[0, "PAID", -20], [1, "SENT", -4]] as const) {
      const issue = date(days);
      const { number, seq, fy } = await nextNumber(issue);
      const inv = await prisma.invoice.create({
        data: { workspaceId: ws, number, seq, fy, token: randomBytes(12).toString("hex"), status, accountId: bloom.id, quoteId: quote.id, billToName: "Bloomfield Organics Pvt Ltd", billToEmail: BRAND_EMAIL, billToGstin: "27AABCB4321M1Z9", billToAddress: "12 Palm Grove, Andheri East, Mumbai 400069", issueDate: issue, dueDate: date(days + 15), quotationRef: `Q-${quote.number}`, paidAt: status === "PAID" ? day(days + 6) : null, sentAt: day(days), createdById: riya.id,
          lines: { create: [{ position: 0, description: `Creator content, ${i === 0 ? "October" : "November"} 2026 (12 reels)`, qty: 1, unitPaise: rs(65000) }, { position: 1, description: "Editing & paid-ready cuts", qty: 1, unitPaise: rs(25000) }] } },
      });
      await refreshInvoice(inv.id);
    }

    const p1 = await prisma.project.create({ data: { workspaceId: ws, stages: [...templateFor("INFLUENCE").stages], name: "Always-on creators · Bloomfield", division: "INFLUENCE", accountId: bloom.id, stage: 3, quota: 12, managerId: riya.id, startDate: date(-14), dueDate: date(10), brief: "Twelve creator reels a month around the new granola range." } });
    await prisma.project.create({ data: { workspaceId: ws, stages: [...templateFor("INFLUENCE").stages], name: "Festive edit · Tidewater", division: "INFLUENCE", accountId: tide.id, stage: 1, managerId: kabir.id, dueDate: date(18) } });
    await prisma.deliverable.createMany({ data: [
      { projectId: p1.id, title: "Reel 1 · Anaya Kulkarni", url: "https://drive.google.com/demo-1", status: "IN_REVIEW" },
      { projectId: p1.id, title: "Reel 2 · Zoya Sheikh", url: "https://drive.google.com/demo-2", status: "APPROVED" },
      { projectId: p1.id, title: "Reel 3 · Dhruv Malhotra", url: "https://drive.google.com/demo-3", status: "CHANGES_REQUESTED" },
    ] });
    await prisma.task.createMany({ data: [
      { workspaceId: ws, title: "Send Nimbus the revised creator list", ownerId: riya.id, createdById: riya.id, dueDate: date(0), priority: "HIGH" },
      { workspaceId: ws, title: "Book Tidewater festive shoot", ownerId: kabir.id, createdById: riya.id, dueDate: date(1) },
      { workspaceId: ws, title: "Follow up Voltride proposal", ownerId: riya.id, createdById: riya.id, dueDate: date(-1) },
      { workspaceId: ws, title: "Collect Bloomfield November PO", ownerId: riya.id, createdById: riya.id, dueDate: date(2) },
      { workspaceId: ws, title: "Shortlist creators for Saffron Street", ownerId: kabir.id, createdById: riya.id, dueDate: date(3) },
    ] });
    out = { plan: plan.id, planToken: plan.token, quote: quote.id, quoteToken: quote.token };
  });
  return { ws, ...out };
}

/** For the local script: make it fresh and say what was made. */
export async function reseedDemo() {
  await removeDemo();
  return withDemoWrites(seedDemo);
}
