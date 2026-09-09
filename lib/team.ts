/**
 * The team.
 *
 * TWO PEOPLE, WHICH IS THE INSTRUCTION AND NOT AN OMISSION. This carried
 * eight placeholder members — job titles standing in for names, each drawn as
 * a monogram — while Genesis decided who goes on the page. They have: the
 * founder and the head of creatives, and nobody else for now.
 *
 * THE PORTRAITS ARE THE AI AVATARS, also at Genesis's instruction. Shivam and
 * Tanvi are both on the AI Lab roster and the roster's own frames are the
 * pictures we have of them. The team tiles do not point at those 1080x1920
 * files directly: a 9:16 full-length shot dropped into a 4:5 box crops to
 * whatever object-cover decides, which put the two of them at visibly
 * different distances. public/team/ holds a hand-cut 4:5 crop of each,
 * framed so the eyes sit at 30% of the height and the head fills about a
 * third of the frame in both. That is what "consistent" means here, and it
 * cannot be done with a CSS keyword.
 *
 * The `pending` flag and the monogram tile stay for the next person added
 * before their photograph arrives.
 */

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  /** Which of the four divisions they sit in, or "Leadership". */
  division: string;
  /** Portrait, once one exists. */
  photo?: string;
  /** One line, in their own words, once there is one. */
  line?: string;
  /** True while the person is a stand-in for a real one. */
  pending?: boolean;
};

/** Initials for the monogram tile, from whatever name we have. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const team = {
  label: "The team",
  heading: "The people",
  headingAccent: "behind it",
  body:
    "Genesis is built in-house: strategy, creative, production and technology under one roof. It is led by the two people below.",
  members: [
    {
      slug: "shivam-mestry",
      name: "Shivam Mestry",
      role: "Founder & CEO",
      division: "Leadership",
      photo: "/team/shivam.jpg",
    },
    {
      slug: "tanvi-panchal",
      name: "Tanvi Panchal",
      role: "Head of Creatives",
      division: "Genesis Studios",
      photo: "/team/tanvi.jpg",
    },
  ] as TeamMember[],
} as const;
