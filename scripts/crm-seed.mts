/**
 * DEMO DATA FOR THE LOCAL CRM — never for a real database.
 *
 *   npm run crm:seed -- you@genesismedia.co
 *
 * Fills the local embedded Postgres (scripts/dev-db.mts) with a believable
 * Genesis week: leads at every stage, brands on plans, an agency with two
 * brands, a reseller, vendors, projects in every division with deliverables
 * waiting for review, an Influence campaign with creators, requests and
 * payments. The email given becomes an OWNER (and an owner of the demo brand's
 * portal, so both sides can be clicked through with one sign-in).
 *
 * Refuses to run against Neon, or anything that isn't localhost.
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ path: ".env.development.local", override: true, quiet: true });

const url = process.env.DATABASE_URL ?? "";
if (!/@(127\.0\.0\.1|localhost):/.test(url)) {
  console.error("Refusing to seed: DATABASE_URL is not the local development database.");
  process.exit(1);
}
const email = (process.argv[2] ?? "owner@genesismedia.co").toLowerCase();
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const day = (n: number) => new Date(Date.now() + n * 864e5);
const date = (n: number) => new Date(day(n).toISOString().slice(0, 10));
const rs = (rupees: number) => rupees * 100;

async function user(mail: string, name: string) {
  return prisma.user.upsert({ where: { email: mail }, create: { auth0Sub: `dev|${mail}`, email: mail, emailVerified: true, name }, update: { name } });
}

const owner = await user(email, "Genesis Owner");
const sales = await user("sales@genesismedia.co", "Riya Sales");
const producer = await user("producer@genesismedia.co", "Kabir Producer");
for (const [u, role] of [[owner, "OWNER"], [sales, "SALES"], [producer, "PRODUCER"]] as const) {
  await prisma.staffRole.upsert({ where: { userId_role: { userId: u.id, role } }, create: { userId: u.id, role }, update: {} });
}

/* Accounts */
const agency = await prisma.account.create({ data: { kind: "AGENCY", status: "ACTIVE", name: "Northlight Agency", email: "team@northlight.example", city: "Mumbai", isReseller: true, commissionPercent: 10, referralCode: "a1b2c3d4", managerId: sales.id } });
const brand = await prisma.account.create({ data: { name: "Aurum Skincare", legalName: "Aurum Skincare Pvt Ltd", gstin: "27AAACA1234A1Z5", email: "marketing@aurum.example", city: "Mumbai", state: "Maharashtra", industry: "D2C beauty", status: "ACTIVE", managerId: sales.id, tags: ["D2C", "priority"] } });
const fintech = await prisma.account.create({ data: { name: "PaySetu", email: "brand@paysetu.example", industry: "Fintech", city: "Bengaluru", status: "ACTIVE", parentId: agency.id, referredById: agency.id, managerId: sales.id } });
const realty = await prisma.account.create({ data: { name: "Skyline Realty", email: "hello@skyline.example", industry: "Real estate", city: "Pune", status: "ACTIVE", parentId: agency.id, managerId: sales.id } });
const editor = await prisma.account.create({ data: { kind: "VENDOR", status: "ACTIVE", name: "Arjun Mehta (editor)", phone: "+91 98200 00000", city: "Mumbai", vendorSkills: ["Editor", "Motion design"], vendorRateNote: "₹6,000 per reel edit" } });
const dop = await prisma.account.create({ data: { kind: "VENDOR", status: "ACTIVE", name: "FrameWorks Productions", city: "Mumbai", vendorSkills: ["DOP", "Crew", "Lighting"], vendorRateNote: "₹35,000 half-day crew" } });
await prisma.accountMember.create({ data: { accountId: brand.id, userId: owner.id, role: "OWNER" } });
await prisma.accountMember.create({ data: { accountId: agency.id, userId: owner.id, role: "OWNER" } });
await prisma.accountMember.create({ data: { accountId: editor.id, userId: owner.id, role: "OWNER" } });

/* Leads across the pipeline */
const leads = [
  ["Neha Kapoor", "Bloom Foods", "AI_LAB", "AI Avatar Clone", "WEBSITE_FORM", "NEW", 24999, 0],
  ["Rohan Iyer", "Velocity Motors", "STUDIOS", "Studios Growth plan", "LINKEDIN", "CONTACTED", 150000, 1],
  ["Sara Thomas", "Kindred Clinics", "INFLUENCE", "Influencer campaign, 15 creators", "REFERRAL", "QUALIFIED", 600000, -1],
  ["Imran Shaikh", "Tealeaf Café", "BRAND_DESIGN", "Brand Build", "INSTAGRAM", "CALL_BOOKED", 89999, 2],
  ["Ananya Rao", "Ledgerly", "AI_LAB", "AI Video Campaign Content Pack", "CHECKOUT", "NEGOTIATION", 47199, 0],
  ["Dev Malhotra", "Urban Nest", "STUDIOS", "Founder / CEO Video Shoot", "PARTNER", "PROPOSAL_SENT", 59999, 3],
  ["Priya Nair", "Aurum Skincare", "INFLUENCE", "UGC Performance Pack", "WEBSITE_FORM", "WON", 79999, 0],
  ["Karan Gill", "Fitstreet", "STUDIOS", "Event coverage", "CALL", "LOST", 120000, 0],
] as const;
for (const [name, company, division, interest, source, status, value, follow] of leads) {
  const lead = await prisma.lead.create({
    data: { name, company, division, interest, source, status, valuePaise: rs(value), email: `${name.split(" ")[0]!.toLowerCase()}@${company.toLowerCase().replace(/\W+/g, "")}.example`, ownerId: sales.id, nextFollowUp: status === "WON" || status === "LOST" ? null : date(follow), partnerId: source === "PARTNER" ? agency.id : null, accountId: status === "WON" ? brand.id : null },
  });
  await prisma.activity.create({ data: { leadId: lead.id, kind: "NOTE", actorId: sales.id, body: `First touch: interested in ${interest}.` } });
}

/* A paid plan with a renewal, and a paid one-time order */
const planOrder = await prisma.order.create({
  data: {
    reference: "GM-DEMO-PLAN", status: "PAID", accountId: brand.id, billing: "quarterly", subtotalPaise: rs(149997), taxPaise: rs(26999), totalPaise: rs(176996), recurringPaise: rs(176996),
    contactName: "Priya Nair", contactEmail: "priya@aurumskincare.example", company: "Aurum Skincare Pvt Ltd", paidAt: day(-35),
    lines: { create: [{ productId: "ai-labs.membership.growth", name: "Growth", group: "AI Content Studio", division: "AI_LAB", kind: "MEMBERSHIP", chargePaise: rs(149997) }] },
  },
});
const sub = await prisma.subscription.create({ data: { razorpayId: "sub_DEMO", status: "ACTIVE", accountId: brand.id, orderId: planOrder.id, billing: "quarterly", amountPaise: rs(176996), paidCount: 1, currentEnd: day(55), nextChargeAt: day(55) } });
await prisma.payment.create({ data: { razorpayId: "pay_DEMO1", amountPaise: rs(176996), method: "card", orderId: planOrder.id, subscriptionId: sub.id, accountId: brand.id, paidAt: day(-35) } });
const ugcOrder = await prisma.order.create({
  data: {
    reference: "GM-DEMO-UGC", status: "PAID", accountId: brand.id, subtotalPaise: rs(79999), taxPaise: rs(14400), totalPaise: rs(94399), oneTimePaise: rs(94399),
    contactName: "Priya Nair", contactEmail: "priya@aurumskincare.example", company: "Aurum Skincare Pvt Ltd", paidAt: day(-12),
    lines: { create: [{ productId: "influence.one-time.ugc-performance-pack", name: "UGC Performance Pack", group: "Influence", division: "INFLUENCE", kind: "ONE_TIME", chargePaise: rs(79999) }] },
  },
});
await prisma.payment.create({ data: { razorpayId: "pay_DEMO2", amountPaise: rs(94399), method: "upi", orderId: ugcOrder.id, accountId: brand.id, paidAt: day(-12) } });
const fintechPay = await prisma.payment.create({ data: { razorpayId: "pay_DEMO3", amountPaise: rs(47199), method: "netbanking", accountId: fintech.id, paidAt: day(-6) } });
await prisma.commission.create({ data: { partnerId: agency.id, paymentId: fintechPay.id, percent: 10, basePaise: rs(39999), amountPaise: rs(4000) } });
await prisma.order.create({
  data: {
    reference: "GM-DEMO-PENDING", status: "PENDING", subtotalPaise: rs(39999), taxPaise: rs(7200), totalPaise: rs(47199), oneTimePaise: rs(47199),
    contactName: "Ananya Rao", contactEmail: "ananya@ledgerly.example", company: "Ledgerly",
    lines: { create: [{ productId: "ai-labs.one-time.ai-video-campaign-content-pack", name: "AI Video Campaign Content Pack", group: "AI Content Studio", division: "AI_LAB", kind: "ONE_TIME", chargePaise: rs(39999) }] },
  },
});

/* Projects in every division */
const ai = await prisma.project.create({ data: { name: "AI Content Studio Growth · October 2026", division: "AI_LAB", accountId: brand.id, orderId: planOrder.id, subscriptionId: sub.id, stage: 2, quota: 8, managerId: producer.id, startDate: date(-10), dueDate: date(5), brief: "Festive skincare explainers with the Aurum avatar." } });
await prisma.deliverable.createMany({
  data: [
    { projectId: ai.id, title: "Reel 1 · Night-repair serum", url: "https://drive.google.com/demo-1", status: "APPROVED", version: 2 },
    { projectId: ai.id, title: "Reel 2 · Vitamin C routine", url: "https://drive.google.com/demo-2", status: "IN_REVIEW" },
    { projectId: ai.id, title: "Reel 3 · Diwali gift box", url: "https://drive.google.com/demo-3", status: "DRAFT" },
  ],
});
const ugc = await prisma.project.create({ data: { name: "UGC Performance Pack", division: "INFLUENCE", accountId: brand.id, orderId: ugcOrder.id, stage: 3, quota: 6, managerId: producer.id, dueDate: date(9) } });
const studio = await prisma.project.create({ data: { name: "Founder film · PaySetu", division: "STUDIOS", accountId: fintech.id, stage: 1, managerId: producer.id, dueDate: date(2) } });
await prisma.project.create({ data: { name: "Brand Build · Skyline Realty", division: "BRAND_DESIGN", accountId: realty.id, stage: 2, managerId: producer.id, dueDate: date(18) } });
await prisma.vendorAssignment.create({ data: { projectId: studio.id, vendorId: dop.id, role: "DOP + crew, half day", feePaise: rs(35000), dueDate: date(2), status: "ACCEPTED" } });
await prisma.vendorAssignment.create({ data: { projectId: ai.id, vendorId: editor.id, role: "Reel edits ×4", feePaise: rs(24000), dueDate: date(4), status: "OFFERED", brief: "Cut 4 reels from the AI renders; brand fonts in the Drive folder." } });
await prisma.vendorInvoice.create({ data: { vendorId: dop.id, number: "FW-2026-118", amountPaise: rs(35000), taxPaise: rs(6300), status: "SUBMITTED" } });

/* The influencer database, and the campaign's creators */
const creators = [
  ["Mira Desai", "mira.glows", 182000, 4.1, ["Beauty", "Skincare"], "Mumbai", 45000],
  ["Aarav Khanna", "aaravfit", 76000, 5.6, ["Fitness"], "Delhi", 18000],
  ["Tanya Bose", "tanyacooks", 410000, 3.2, ["Food"], "Kolkata", 90000],
  ["Kabir Sen", "kabirtech", 1250000, 2.4, ["Tech", "Finance"], "Bengaluru", 250000],
  ["Ishita Verma", "ishitastyle", 9400, 7.9, ["Fashion", "Beauty"], "Pune", 6000],
] as const;
const tier = (f: number) => (f >= 1e6 ? "MEGA" : f >= 5e5 ? "MACRO" : f >= 1e5 ? "MID" : f >= 1e4 ? "MICRO" : "NANO");
for (const [name, handle, followers, er, niches, city, reel] of creators) {
  const c = await prisma.creator.create({ data: { name, handle, followers, engagementRate: er, niches: [...niches], city, reelRatePaise: rs(reel), tier: tier(followers), languages: ["Hindi", "English"] } });
  if (niches.includes("Beauty" as never) || niches.includes("Skincare" as never)) {
    await prisma.campaignCreator.create({ data: { projectId: ugc.id, creatorId: c.id, status: handle === "mira.glows" ? "POSTED" : "CONFIRMED", feePaise: rs(reel), deliverables: "1 reel + 2 stories", views: handle === "mira.glows" ? 214000 : null, postUrl: handle === "mira.glows" ? "https://instagram.com/p/demo" : null } });
  }
}

/* Requests, messages, tasks */
const req = await prisma.request.create({ data: { accountId: brand.id, projectId: ai.id, kind: "NEW_CONTENT", title: "Diwali offer reels", body: "We're running 20% off from 20 Oct. Can two of this month's reels feature the gift box?", createdById: owner.id } });
await prisma.message.create({ data: { accountId: brand.id, requestId: req.id, authorId: producer.id, fromStaff: true, body: "Yes, swapping reels 3 and 4 to the gift box. Script by Thursday." } });
await prisma.message.create({ data: { accountId: brand.id, projectId: ai.id, authorId: producer.id, fromStaff: true, body: "Reel 2 is ready for your review." } });
await prisma.message.create({ data: { accountId: brand.id, projectId: ai.id, authorId: producer.id, fromStaff: true, internal: true, body: "Client prefers warmer grade; keep LUT B." } });
await prisma.task.createMany({
  data: [
    { title: "Send PaySetu shoot call sheet", ownerId: owner.id, projectId: studio.id, dueDate: date(0), priority: "HIGH" },
    { title: "Proposal deck for Urban Nest", ownerId: sales.id, dueDate: date(1) },
    { title: "Chase Ledgerly checkout", ownerId: owner.id, dueDate: date(-1) },
  ],
});

console.log(`Seeded. Sign in at /login as ${email} (owner, and portal owner of Aurum Skincare, Northlight Agency and the editor vendor).`);
await prisma.$disconnect();
