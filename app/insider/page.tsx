import { FileText, Inbox, LayoutGrid, Lock, Users } from "lucide-react";

import { InsiderRail } from "./insider-rail";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GenesisMark } from "@/components/genesis/genesis-mark";
import { GlassButton } from "@/components/genesis/glass-button";
import { SectionLabel } from "@/components/genesis/section-label";
import { getInsiderAccess } from "@/lib/access";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

/**
 * Genesis Insider — dashboard shell.
 *
 * Scope is deliberately narrow. The full Workspace (clients, projects, content
 * pipeline, invoicing, automations) is a separate build and explicitly out of
 * scope; those modules appear here as locked placeholders so the shape is
 * visible without implying they exist.
 *
 * The one live panel is contact submissions, because that table is ours and
 * already populated by the public forms — a dashboard whose every number is
 * fake teaches you nothing about whether the wiring works.
 */

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  name: string;
  email: string;
  type: string;
  source: string | null;
  createdAt: Date;
};

async function getRecentSubmissions(): Promise<Submission[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getPrisma().contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        source: true,
        createdAt: true,
      },
    });
  } catch {
    // A dashboard should degrade to "unavailable", never to a 500.
    return null;
  }
}

const WORKSPACE_MODULES = [
  { title: "Clients & brands", icon: Users },
  { title: "Projects", icon: LayoutGrid },
  { title: "Content pipeline", icon: FileText },
  { title: "Invoicing", icon: Inbox },
];

export default async function InsiderPage() {
  const access = await getInsiderAccess();

  // The layout blocks every non-granted state; this narrows the type.
  if (access.status !== "granted") return null;

  const { user } = access;
  const submissions = await getRecentSubmissions();

  return (
    <Atmosphere tone="brand" origin="top-right" intensity={0.14} className="min-h-dvh">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        {/* The rail from p08_1 — a floating glass control, not a sidebar. */}
        <InsiderRail />

        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <GenesisMark />
            <h1 className="mt-6 text-h2 font-normal tracking-tight text-bone">
              {user.name ?? user.email}
            </h1>
            <p className="mt-2 text-small text-ash">
              {user.email} · role {user.role}
            </p>
          </div>

          <GlassButton href="/auth/logout" variant="ghost" size="sm">
            Sign out
          </GlassButton>
        </header>

        {/* Live: inbound submissions from the public forms. */}
        <section className="glass glass-lit rounded-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <SectionLabel dot>Inbound</SectionLabel>
            <span className="text-small text-faint">
              {submissions ? `${submissions.length} most recent` : "unavailable"}
            </span>
          </div>

          {submissions === null ? (
            <p className="mt-6 text-small text-ash">
              Not connected to the database yet. Once{" "}
              <code className="rounded bg-white/10 px-2 py-0.5">DATABASE_URL</code>{" "}
              is set, submissions from the contact, creator and careers forms
              appear here.
            </p>
          ) : submissions.length === 0 ? (
            <p className="mt-6 text-small text-ash">
              No submissions yet. The forms on /creator, /careers and the
              homepage all write here.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-small">
                <thead>
                  <tr className="border-b border-white/10 text-small text-faint">
                    <th scope="col" className="pb-3 font-medium">Name</th>
                    <th scope="col" className="pb-3 font-medium">Email</th>
                    <th scope="col" className="pb-3 font-medium">Type</th>
                    <th scope="col" className="pb-3 font-medium">Source</th>
                    <th scope="col" className="pb-3 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-white/5">
                      <td className="py-3 text-bone">{submission.name}</td>
                      <td className="py-3 text-ash">{submission.email}</td>
                      <td className="py-3 text-ash">{submission.type}</td>
                      <td className="py-3 text-faint">{submission.source ?? "not set"}</td>
                      <td className="py-3 text-faint">
                        {submission.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Out of scope: shown as locked so the shape is legible. */}
        <section>
          <SectionLabel>Workspace — not built yet</SectionLabel>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSPACE_MODULES.map((module) => (
              <div
                key={module.title}
                className="glass flex flex-col gap-3 rounded-card p-6 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <module.icon className="size-5 text-ash" aria-hidden />
                  <Lock className="size-3.5 text-faint" aria-hidden />
                </div>
                <p className="text-small font-medium text-bone">{module.title}</p>
                <p className="text-small text-faint">Separate build</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-small leading-relaxed text-faint">
            The Genesis Workspace — client and project management, the content
            production pipeline, invoicing and automations — is a separate
            build. The infrastructure here (auth, database, storage, audit
            trail) is arranged so those can be added without re-architecting.
          </p>
        </section>
      </div>
    </Atmosphere>
  );
}
