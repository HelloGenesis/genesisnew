/** Influencer categories to pick from (Genesis, 11 Oct 2026: "dropdown with influencer categories, add custom as well"). */
export const NICHES = [
  "Fashion", "Beauty", "Skincare", "Lifestyle", "Fitness", "Health & Wellness", "Yoga & Meditation", "Food", "Travel", "Tech", "Gaming",
  "Finance", "Business & Startups", "Education", "Comedy", "Entertainment", "Acting & Film", "Parenting", "Mom & Baby", "Couple", "Home & Decor",
  "Automotive", "Sports", "Cricket", "Music", "Dance", "Art & Design", "Photography", "Pets", "Spirituality",
  "Motivation", "Real Estate", "Luxury", "Men's Grooming", "Sustainability", "Books", "Regional", "Celebrity",
];

/*
 * ONE NAME PER CATEGORY (Genesis, 13 Oct 2026: "there are a lot of duplicate
 * categories"). The sheets wrote the same niche many ways — "fashion",
 * "FASHION", "Fashion and Lifestyle", "Health&fitness", "Skin Care", "Fasion" —
 * and slipped in tiers, cities and bios. Each word or phrase below points at
 * one category above; null means it says nothing about the niche.
 */
const PHRASES: Record<string, string | null> = {
  "skin care": "Skincare", "make up": "Beauty", "makeup artist": "Beauty", "hair care": "Beauty", "home decor": "Home & Decor", "real estate": "Real Estate",
  "food blogger": "Food", "mom blogger": "Mom & Baby", "personal growth": "Motivation", "personal trainer": "Fitness", "stand up": "Comedy", "deep house": "Music",
  "hard techno": "Music", "content creator": null, "digital creator": null, "video creator": null, "mental health": "Health & Wellness", "holistic health": "Health & Wellness",
  "chartered accountant": "Finance", "song writer": "Music", "tv presenter": "Entertainment", "niche to verify": null, "campaign listed": null, "mid tier": null,
  "men grooming": "Men's Grooming", "mens grooming": "Men's Grooming", "business startups": "Business & Startups", "art design": "Art & Design", "mom baby": "Mom & Baby",
};
const WORDS: Record<string, string | null> = {
  fashion: "Fashion", model: "Fashion", modelling: "Fashion", modeling: "Fashion", styling: "Fashion", style: "Fashion", streetwear: "Fashion", sneakers: "Fashion", accessory: "Fashion", accessories: "Fashion", accessoires: "Fashion", outfits: "Fashion", clothing: "Fashion",
  beauty: "Beauty", makeup: "Beauty", hair: "Beauty", haircare: "Beauty", beautiful: "Beauty",
  skincare: "Skincare", skin: "Skincare", dermatologist: "Skincare",
  lifestyle: "Lifestyle", life: "Lifestyle", vlog: "Lifestyle", vlogs: "Lifestyle", vlogger: "Lifestyle", trends: "Lifestyle",
  fitness: "Fitness", fit: "Fitness", gym: "Fitness", calisthenics: "Fitness", trainer: "Fitness", pranayama: "Yoga & Meditation",
  health: "Health & Wellness", healthy: "Health & Wellness", healthcare: "Health & Wellness", wellness: "Health & Wellness", wellbeing: "Health & Wellness", holistic: "Health & Wellness", ayurveda: "Health & Wellness", nutrition: "Health & Wellness", nutritionist: "Health & Wellness", dietitian: "Health & Wellness", diet: "Health & Wellness", diabetes: "Health & Wellness", thyroid: "Health & Wellness", hormones: "Health & Wellness", gut: "Health & Wellness", autoimmunity: "Health & Wellness", doctor: "Health & Wellness", doc: "Health & Wellness",
  yoga: "Yoga & Meditation", meditation: "Yoga & Meditation", mindfulness: "Yoga & Meditation",
  food: "Food", foodie: "Food", chef: "Food", cuisine: "Food", recipes: "Food", cooking: "Food", fb: "Food",
  travel: "Travel", travelling: "Travel", traveller: "Travel", exploration: "Travel",
  tech: "Tech", technology: "Tech", gadgets: "Tech", productivity: "Tech",
  gaming: "Gaming", gamer: "Gaming",
  finance: "Finance", taxes: "Finance", ca: "Finance", investing: "Finance",
  business: "Business & Startups", entrepreneur: "Business & Startups", startup: "Business & Startups", startups: "Business & Startups",
  education: "Education", student: "Education", students: "Education", college: "Education",
  comedy: "Comedy", comedian: "Comedy", funny: "Comedy", humor: "Comedy", humour: "Comedy", standup: "Comedy", sketches: "Comedy", relatable: "Comedy",
  entertainment: "Entertainment", podcast: "Entertainment", presenter: "Entertainment", emcee: "Entertainment", anchor: "Entertainment", rj: "Entertainment", magician: "Entertainment", mentalist: "Entertainment", voiceovers: "Entertainment", storytelling: "Entertainment",
  actor: "Acting & Film", actors: "Acting & Film", actress: "Acting & Film", acting: "Acting & Film", filmmaking: "Acting & Film", bollywood: "Acting & Film",
  parenting: "Parenting", kid: "Parenting", kids: "Parenting", child: "Parenting", family: "Parenting",
  mom: "Mom & Baby", mommy: "Mom & Baby", baby: "Mom & Baby",
  couple: "Couple", couples: "Couple",
  home: "Home & Decor", decor: "Home & Decor",
  automobile: "Automotive", automotive: "Automotive", cars: "Automotive", biker: "Automotive",
  sports: "Sports", athlete: "Sports", olympic: "Sports",
  cricket: "Cricket", cricketer: "Cricket", cricketers: "Cricket",
  music: "Music", musician: "Music", singer: "Music", singing: "Music", rapper: "Music", dj: "Music", techno: "Music", house: "Music", melodic: "Music", afro: "Music", acid: "Music", peaktime: "Music", electronica: "Music", flute: "Music",
  dance: "Dance", dancer: "Dance", dancing: "Dance", choreographer: "Dance",
  art: "Art & Design", artist: "Art & Design", design: "Art & Design", designer: "Art & Design",
  photography: "Photography", photographer: "Photography",
  pets: "Pets", pet: "Pets", cat: "Pets", dog: "Pets",
  spirituality: "Spirituality", spiritual: "Spirituality",
  motivation: "Motivation", motivational: "Motivation", inspirational: "Motivation", mindset: "Motivation", habits: "Motivation", speaker: "Motivation", tedx: "Motivation", coach: "Motivation",
  luxury: "Luxury", grooming: "Men's Grooming", sustainability: "Sustainability", books: "Books", author: "Books", celebrity: "Celebrity",
  // Spellings seen in the sheets.
  entertaimnet: "Entertainment", entertainmnet: "Entertainment", enteraiment: "Entertainment", enterainment: "Entertainment", entertaiment: "Entertainment", comdey: "Comedy", listyle: "Lifestyle", moodel: "Fashion", athelite: "Sports", fahion: "Fashion", fasion: "Fashion", beuaty: "Beauty", crickter: "Cricket", skincar: "Skincare", welllbeing: "Health & Wellness", nrutritionist: "Health & Wellness", entreprenuer: "Business & Startups",
  lipsync: "Entertainment", fashionbeauty: "Fashion",
  // Not a niche: tiers, labels, filler, places.
  creator: null, creators: null, content: null, influencer: null, blogger: null, ugc: null, category: null, niche: null, value: null, live: null, peak: null, roster: null, campaign: null, listed: null, micro: null, macro: null, mega: null, nano: null, tier: null, events: null, event: null,
  and: null, of: null, the: null, a: null, b: null, c: null, in: null, to: null, for: null, is: null, my: null, all: null, on: null, any: null, everything: null, i: null, can: null, create: null, with: null, open: null, too: null, so: null, etc: null, s: null, u: null, fun: null, videos: null, girl: null, desi: null, indian: null, aesthetic: null, reviews: null, professional: null, international: null, teacher: null, state: null,
  delhi: null, new: null, mumbai: null, navi: null, pune: null, hyderabad: null, bangalore: null, bengaluru: null, gurugram: null, kolkata: null, surat: null, varanasi: null, assam: null, gujarat: null, bengal: null, ahmedabad: null, ahemdabad: null, up: null, chennai: null, jaipur: null,
};

const KEYS = Object.keys(WORDS).filter((w) => w.length >= 5 && WORDS[w]);
function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]!;
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = d[j]!;
      d[j] = Math.min(d[j]! + 1, d[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return d[b.length]!;
}
/** A word's category, forgiving a typo or two ("Fasion", "Entertaimnet", "Crickter"). */
function wordNiche(w: string): string | null | undefined {
  if (w in WORDS) return WORDS[w];
  const singular = w.replace(/s$/, "");
  if (singular in WORDS) return WORDS[singular];
  if (w.length < 5) return undefined;
  const best = KEYS.map((k) => [k, near(w, k)] as const).sort((x, y) => x[1] - y[1])[0];
  return best && best[1] <= (w.length >= 8 ? 2 : 1) ? WORDS[best[0]] : undefined;
}

/**
 * Turns whatever a sheet or a person wrote into the standard categories:
 * "fashion beauty lifestyle" → Fashion, Beauty, Lifestyle. A part that names no
 * known category is returned in `other` (kept as a custom niche when a person
 * typed it; kept in the notes when it came from a sheet).
 */
export function cleanNiches(raw: readonly string[]): { niches: string[]; other: string[] } {
  const niches: string[] = [];
  const other: string[] = [];
  const add = (n: string) => !niches.some((x) => x.toLowerCase() === n.toLowerCase()) && niches.push(n);
  for (const value of raw) {
    const exact = NICHES.find((n) => n.toLowerCase() === value.trim().toLowerCase());
    if (exact) {
      add(exact);
      continue;
    }
    for (const part of value.split(/[,/&+|;:●•.\n]|\band\b|-\s/i)) {
      const words = part.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
      if (!words.length) continue;
      let known = 0;
      let unknown = 0;
      for (let i = 0; i < words.length; i++) {
        const pair = `${words[i]} ${words[i + 1] ?? ""}`;
        if (words[i + 1] && pair in PHRASES) {
          if (PHRASES[pair]) add(PHRASES[pair]!);
          known++;
          i++;
          continue;
        }
        const n = wordNiche(words[i]!);
        if (n === undefined) unknown++;
        else {
          known++;
          if (n) add(n);
        }
      }
      if (!known && unknown && /[a-z]{2}/i.test(part)) other.push(part.trim().replace(/\s+/g, " ").slice(0, 60));
    }
  }
  return { niches, other: [...new Set(other)] };
}

/** For a person's own entry: the standard categories, plus anything custom they typed (tidied to Title Case). */
export function tidyNiches(raw: readonly string[]): string[] {
  const { niches, other } = cleanNiches(raw);
  const custom = other.filter((o) => o.length <= 30).map((o) => o.replace(/\b\w/g, (c) => c.toUpperCase()));
  return [...niches, ...custom.filter((c) => !niches.some((n) => n.toLowerCase() === c.toLowerCase()))].slice(0, 12);
}
