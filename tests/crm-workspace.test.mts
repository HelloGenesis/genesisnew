/**
 * AGENCY CRMS KEPT APART (lib/db withWorkspaces) — against the local database.
 *
 *   npm run test:db
 *
 * Makes two throwaway agency CRMs, writes and reads inside each, and removes
 * everything it made. Refuses any database but the local one.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { inWorkspace } from "../lib/crm/request-workspace";
import { getPrisma } from "../lib/db";

if (!/@(127\.0\.0\.1|localhost):/.test(process.env.DATABASE_URL ?? "")) throw new Error("Refusing: DATABASE_URL is not the local development database.");

const p = getPrisma();
const TAG = `ws-test-${Date.now()}`;
let a = "";
let b = "";

before(async () => {
  a = (await p.account.create({ data: { name: `${TAG} A`, kind: "AGENCY", crmWorkspace: true, workspaceId: null } })).id;
  b = (await p.account.create({ data: { name: `${TAG} B`, kind: "AGENCY", crmWorkspace: true, workspaceId: null } })).id;
});

after(async () => {
  await p.task.deleteMany({ where: { title: { startsWith: TAG } } });
  await p.account.deleteMany({ where: { name: { startsWith: TAG } } });
});

const mine = (db = p) => db.task.findMany({ where: { title: { startsWith: TAG } }, select: { title: true, workspaceId: true } });

test("inWorkspace tags what it creates and sees only its own CRM, whatever shape the callback has", async () => {
  /* Each shape that used to escape: a query handed straight back (lazy until awaited), and one from a helper. */
  const lazy = await inWorkspace(a, () => p.task.create({ data: { title: `${TAG} lazy` } }));
  const awaited = await inWorkspace(a, async () => await p.task.create({ data: { title: `${TAG} awaited` } }));
  const viaDb = await inWorkspace(a, (db) => db.task.create({ data: { title: `${TAG} db` } }));
  const helper = () => p.task.create({ data: { title: `${TAG} helper` } });
  const nested = await inWorkspace(a, helper);
  const inTx = await inWorkspace(a, () => p.$transaction((tx) => tx.task.create({ data: { title: `${TAG} tx` } })));
  for (const t of [lazy, awaited, viaDb, nested, inTx]) assert.equal(t.workspaceId, a, t.title);

  await p.task.create({ data: { title: `${TAG} genesis`, workspaceId: null } });
  await p.task.create({ data: { title: `${TAG} other`, workspaceId: b } });

  assert.equal(await inWorkspace(a, () => p.task.count({ where: { title: { startsWith: TAG } } })), 5);
  assert.ok((await inWorkspace(a, () => mine())).every((t) => t.workspaceId === a));
  assert.deepEqual((await inWorkspace(b, () => mine())).map((t) => t.title), [`${TAG} other`]);
  assert.deepEqual((await inWorkspace(null, (db) => mine(db))).map((t) => t.title), [`${TAG} genesis`]);
  /* Writes are held too: CRM B can't touch CRM A's tasks. */
  assert.equal((await inWorkspace(b, () => p.task.updateMany({ where: { title: `${TAG} lazy` }, data: { title: `${TAG} lazy!` } }))).count, 0);
  /* Outside any CRM (a job, a script) nothing is filtered. */
  assert.equal((await mine()).length, 7);
});

test("getPrisma(ws) is bound to its CRM, inside another CRM's scope too", async () => {
  const t = await inWorkspace(a, () => getPrisma(b).task.create({ data: { title: `${TAG} bound` } }));
  assert.equal(t.workspaceId, b);
  assert.ok((await getPrisma(b).task.findMany({ where: { title: { startsWith: TAG } } })).every((x) => x.workspaceId === b));
  await getPrisma(b).task.delete({ where: { id: t.id } });
});

test("two CRMs at once never see each other's records", async () => {
  const run = (ws: string, i: number) =>
    inWorkspace(ws, async () => {
      await new Promise((r) => setTimeout(r, Math.random() * 20));
      const made = await p.task.create({ data: { title: `${TAG} c${i}` } });
      await new Promise((r) => setTimeout(r, Math.random() * 20));
      const seen = await Promise.all(Array.from({ length: 60 }, () => mine()));
      return { ws, made: made.workspaceId, seen: seen.flat().map((x) => x.workspaceId) };
    });
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => run(i % 2 ? a : b, i)));
  for (const r of results) {
    assert.equal(r.made, r.ws);
    assert.ok(r.seen.length > 0 && r.seen.every((w) => w === r.ws), `${r.ws} saw another CRM`);
  }
});
