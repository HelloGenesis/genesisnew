/**
 * REPHRASING WITHOUT AI (Genesis, 3 Nov 2026: "a few rephrasing tools here,
 * secured, instead of using AI again and again just to draft it"). Plain word
 * and phrase rules that run in the browser: nothing is sent anywhere and
 * nothing costs credits. Each tool returns the new text and how many changes
 * it made.
 */

type Rule = [RegExp, string];

/* Whole words or phrases, any case; the replacement keeps a leading capital. */
const rules = (pairs: [string, string][]): Rule[] =>
  pairs.map(([from, to]) => [new RegExp(`(?<![\\w'])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")}(?![\\w'])`, "gi"), to]);

function apply(text: string, list: Rule[]) {
  let changes = 0;
  let out = text;
  for (const [re, to] of list) {
    out = out.replace(re, (match) => {
      changes++;
      if (!to) return "";
      return /^[A-Z]/.test(match) ? to[0]!.toUpperCase() + to.slice(1) : to;
    });
  }
  return { text: out, changes };
}

/* Spaces and punctuation left behind by removals and rewrites. */
function tidy(text: string) {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])(?=[A-Za-z])/g, (m, p, i, s) => (/\d/.test(s[i - 1] ?? "") || /[./]/.test(p) && /\w/.test(s[i - 1] ?? "") && /\w/.test(s[i + 1] ?? "") ? m : `${p} `))
    .replace(/,\s*,/g, ",")
    .replace(/^ +| +$/gm, "")
    .replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .replace(/(^|\s)i(?=\s|'|$)/g, "$1I")
    .replace(/^ +| +$/gm, "");
}

/* Common misspellings, and phrases that read wrong in an email to a client. */
const FIX = rules([
  ["dicuss", "discuss"], ["disucss", "discuss"], ["discus", "discuss"], ["recieve", "receive"], ["recieved", "received"], ["acheive", "achieve"],
  ["adress", "address"], ["accomodate", "accommodate"], ["agressive", "aggressive"], ["apparantly", "apparently"], ["begining", "beginning"],
  ["beleive", "believe"], ["buisness", "business"], ["bussiness", "business"], ["calender", "calendar"], ["catagory", "category"],
  ["collegue", "colleague"], ["comission", "commission"], ["commited", "committed"], ["comittee", "committee"], ["completly", "completely"],
  ["concious", "conscious"], ["definately", "definitely"], ["definitly", "definitely"], ["dilema", "dilemma"], ["embarass", "embarrass"],
  ["enviroment", "environment"], ["existance", "existence"], ["familar", "familiar"], ["finaly", "finally"], ["foward", "forward"],
  ["fowarded", "forwarded"], ["freind", "friend"], ["goverment", "government"], ["guarentee", "guarantee"], ["happend", "happened"],
  ["immediatly", "immediately"], ["independant", "independent"], ["influencor", "influencer"], ["infuencer", "influencer"], ["infomation", "information"],
  ["intrested", "interested"], ["knowlege", "knowledge"], ["liason", "liaison"], ["maintainance", "maintenance"], ["managment", "management"],
  ["neccessary", "necessary"], ["necesary", "necessary"], ["noticable", "noticeable"], ["occassion", "occasion"], ["occured", "occurred"],
  ["occurence", "occurrence"], ["oppurtunity", "opportunity"], ["opportunites", "opportunities"], ["payed", "paid"], ["persue", "pursue"],
  ["posession", "possession"], ["prefered", "preferred"], ["presense", "presence"], ["proceedure", "procedure"], ["publically", "publicly"],
  ["realy", "really"], ["reccomend", "recommend"], ["recomend", "recommend"], ["refered", "referred"], ["relevent", "relevant"],
  ["remeber", "remember"], ["resturant", "restaurant"], ["schedual", "schedule"], ["seperate", "separate"], ["sincerly", "sincerely"],
  ["succesful", "successful"], ["successfull", "successful"], ["suprise", "surprise"], ["teh", "the"], ["tommorow", "tomorrow"],
  ["tomorow", "tomorrow"], ["truely", "truly"], ["untill", "until"], ["wich", "which"], ["writting", "writing"], ["thier", "their"],
  ["alot", "a lot"], ["thankyou", "thank you"], ["pls", "please"], ["plz", "please"], ["thx", "thanks"], ["u", "you"], ["ur", "your"],
  ["discuss on", "discuss"], ["discuss about", "discuss"], ["proceed ahead", "proceed"], ["proceed further", "proceed"], ["revert back", "get back"],
  ["return back", "return"], ["repeat again", "repeat"], ["reply back", "reply"], ["each and every", "every"], ["do the needful", "take care of this"],
  ["prepone", "bring forward"], ["over a meet", "over a meeting"], ["on a meet", "on a meeting"], ["have a meet", "have a meeting"], ["schedule a meet", "schedule a meeting"], ["kindly revert", "please let us know"], ["same will be", "it will be"], ["PFA", "please find attached"],
  ["please find attached herewith", "I've attached"], ["attached herewith", "attached"],
]);

/* Warmer, more polished. */
const FORMAL = rules([
  ["please have a look", "please review it"], ["have a look", "take a look"], ["if we can", "if we could"], ["can we", "could we"], ["can you", "could you"], ["connect over", "speak over"], ["get on a call", "schedule a call"], ["sharing the", "Please find the"], ["hey", "Hello"], ["hi", "Hello"], ["thanks a lot", "thank you very much"], ["thanks", "thank you"], ["let's", "let us"],
  ["can't", "cannot"], ["won't", "will not"], ["don't", "do not"], ["didn't", "did not"], ["isn't", "is not"], ["it's", "it is"],
  ["we're", "we are"], ["you're", "you are"], ["I'm", "I am"], ["we'll", "we will"], ["I'll", "I will"], ["we've", "we have"], ["I've", "I have"],
  ["get back to you", "respond to you"],
  ["asap", "at the earliest"], ["ASAP", "at the earliest"], ["FYI", "for your reference"],
  ["check out", "review"], ["look at", "review"], ["go over", "review"], ["talk about", "discuss"], ["a lot of", "many"],
  ["lots of", "many"], ["right now", "at present"], ["ok", "fine"], ["okay", "fine"], ["sorry", "apologies"],
 
]);

/* Easier, more personal. */
const FRIENDLY = rules([
  ["dear", "Hi"], ["hello", "Hi"], ["thank you very much", "thanks so much"], ["thank you", "thanks"], ["let us connect", "let's connect"], ["let us discuss", "let's discuss"], ["let us start", "let's start"], ["let us do", "let's do"], ["let us get", "let's get"], ["let us speak", "let's speak"], ["let us know", "do let us know"], ["please review it", "have a look"], ["could we", "can we"],
  ["cannot", "can't"], ["will not", "won't"], ["do not", "don't"], ["did not", "didn't"], ["is not", "isn't"], ["it is", "it's"],
  ["we are", "we're"], ["you are", "you're"], ["I am", "I'm"], ["we will", "we'll"], ["I will", "I'll"], ["we have", "we've"], ["I have", "I've"],
  ["at the earliest", "as soon as you can"], ["please find attached", "I've attached"], ["kindly", "please"], ["require", "need"],
  ["assist", "help"], ["regarding", "about"], ["in regard to", "about"], ["with regard to", "about"], ["commence", "start"],
  ["utilise", "use"], ["utilize", "use"], ["purchase", "buy"], ["respond to you", "get back to you"], ["apologies", "sorry"],
  ["at present", "right now"], ["best regards", "Cheers"], ["kind regards", "Cheers"], ["yours sincerely", "Cheers"], ["regards", "Cheers"],
]);

/* Fewer words for the same thing. */
const SHORTER = rules([
  ["please have a look and let us know", "let us know"], ["please have a look and let me know", "let me know"], ["please go through it and let us know", "let us know"], ["in order to", "to"], ["at this point in time", "now"], ["at the present time", "now"], ["due to the fact that", "because"],
  ["in spite of the fact that", "although"], ["for the purpose of", "for"], ["in the event that", "if"], ["with regard to", "about"],
  ["in regard to", "about"], ["with reference to", "about"], ["a number of", "several"], ["a large number of", "many"], ["the majority of", "most"],
  ["at the earliest possible", "soon"], ["at the earliest", "soon"], ["in the near future", "soon"], ["prior to", "before"], ["subsequent to", "after"],
  ["has the ability to", "can"], ["is able to", "can"], ["are able to", "can"], ["make a decision", "decide"], ["take into consideration", "consider"],
  ["give consideration to", "consider"], ["I just wanted to let you know that", ""], ["I wanted to let you know that", ""], ["just wanted to let you know that", ""], ["I just wanted to", "I'd like to"], ["please note that", ""],
  ["it is important to note that", ""], ["I would like to", "I'd like to"], ["we would like to", "we'd like to"], ["as you may know,", ""],
  ["needless to say,", ""], ["basically", ""], ["actually", ""], ["really", ""], ["very", ""], ["just", ""], ["totally", ""], ["literally", ""],
  ["quite", ""], ["each and every", "every"], ["first and foremost", "first"], ["end result", "result"], ["final outcome", "outcome"],
  ["future plans", "plans"], ["past history", "history"], ["advance planning", "planning"], ["close proximity", "near"], ["completely finished", "finished"],
]);

/*
 * SAY IT ANOTHER WAY: common client-email phrases, each with a few ways to say
 * it. Every click moves to the next wording, so it never repeats itself.
 */
const BANK: [string, string[]][] = [
  ["please have a look", ["please take a look", "please go through it", "do have a look"]],
  ["have a look", ["take a look", "go through it", "review it"]],
  ["let us know", ["tell us", "do tell us", "do let us know"]],
  ["let me know", ["tell me", "drop me a note", "do let me know"]],
  ["if we can connect over a meeting", ["if we could catch up on a call", "whether we can get on a quick call", "if we can meet over a call"]],
  ["connect over a meeting", ["catch up on a call", "get on a quick call", "meet over a call"]],
  ["if we can connect", ["if we could speak", "whether we can catch up", "if we can get on a call"]],
  ["how to proceed ahead", ["the next steps", "how to move forward", "how we take it ahead"]],
  ["how to proceed", ["the next steps", "how to move forward", "how we take it ahead"]],
  ["sharing the", ["here's the", "attaching the", "please find the"]],
  ["please find attached", ["I've attached", "attached is", "here's"]],
  ["as discussed", ["as we discussed", "following our conversation", "as per our call"]],
  ["get back to you", ["come back to you", "respond", "revert"]],
  ["at the earliest", ["as soon as you can", "soon", "when you get a moment"]],
  ["looking forward to", ["we look forward to", "keen to hear about", "awaiting"]],
  ["we would love to", ["we'd be glad to", "we're keen to", "we'd be happy to"]],
  ["happy to", ["glad to", "more than happy to", "keen to"]],
  ["feel free to", ["please don't hesitate to", "do", "you're welcome to"]],
  ["if you have any questions", ["if anything is unclear", "for any questions", "if you need anything"]],
  ["thank you for", ["thanks for", "we appreciate", "grateful for"]],
  ["we can start", ["we'll begin", "we can kick off", "we'll get going"]],
  ["get started", ["kick off", "begin", "get going"]],
  ["discuss", ["go over", "talk through", "discuss"]],
  ["kindly", ["please", "please", "do"]],
  ["approve it", ["sign off on it", "give it the go-ahead", "confirm it"]],
  ["any changes", ["any edits", "anything changed", "any tweaks"]],
];

function reword(text: string, turn: number) {
  let changes = 0;
  let out = text;
  /* A phrase handled as part of a longer one isn't changed again (BANK lists the longer first). */
  const skip = new Set<number>();
  BANK.forEach(([from, options], idx) => {
    if (skip.has(idx)) return;
    const re = new RegExp(`(?<![\\w'])${from.replace(/ /g, "\\s+")}(?![\\w'])`, "gi");
    let hit = false;
    out = out.replace(re, (match) => {
      hit = true;
      const to = options[turn % options.length]!;
      if (to.toLowerCase() === match.toLowerCase()) return match;
      changes++;
      return /^[A-Z]/.test(match) ? to[0]!.toUpperCase() + to.slice(1) : to;
    });
    if (hit) BANK.forEach(([f], k) => k > idx && from.toLowerCase().includes(f) && skip.add(k));
  });
  return { text: out, changes };
}

export type Tool = "fix" | "rephrase" | "formal" | "friendly" | "shorter";
export const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "fix", label: "Fix", hint: "Spelling and phrases like \u201cdiscuss on\u201d or \u201cproceed ahead\u201d" },
  { id: "rephrase", label: "Rephrase", hint: "Says common phrases another way; click again for another wording" },
  { id: "formal", label: "More formal", hint: "Polished, no contractions" },
  { id: "friendly", label: "Friendlier", hint: "Warmer and easier" },
  { id: "shorter", label: "Shorter", hint: "Drops filler words and long phrases" },
];

/* Links, emails and @handles are left exactly as they are. */
const KEEP = /\b(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+\.[\w.-]+|@\w[\w.]*/g;

export function rephrase(text: string, tool: Tool, turn = 0): { text: string; changes: number } {
  const kept: string[] = [];
  const shielded = text.replace(KEEP, (m) => `\u0000${kept.push(m) - 1}\u0000`);
  const fixed = apply(shielded, FIX);
  const r = tool === "fix" ? { text: fixed.text, changes: 0 } : tool === "rephrase" ? reword(fixed.text, turn) : apply(fixed.text, tool === "formal" ? FORMAL : tool === "friendly" ? FRIENDLY : SHORTER);
  return { text: tidy(r.text).replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)] ?? ""), changes: fixed.changes + r.changes };
}

/* Ready messages for the usual moments; {name} and {title} are filled in. */
export const TEMPLATES: { label: string; text: string }[] = [
  { label: "Sharing the plan", text: "Hi {name},\n\nHere's the plan for {title}. Have a look and let us know if you'd like any changes; we can start as soon as you approve it on the link." },
  { label: "Sharing the quote", text: "Hi {name},\n\nThank you for the brief. Here's our quotation for {title}, as we discussed. Approve it on the link and we'll get started." },
  { label: "Suggest a call", text: "Hi {name},\n\nShall we get on a quick Google Meet to go through {title} and the next steps? Share a time that suits you and I'll send an invite." },
  { label: "Revised version", text: "Hi {name},\n\nAs discussed, here's the revised version of {title} with your changes. Let us know if everything looks right." },
  { label: "Gentle follow-up", text: "Hi {name},\n\nJust following up on {title}. Did you get a chance to look at it? Happy to answer any questions." },
  { label: "Payment reminder", text: "Hi {name},\n\nA friendly reminder about the payment for {title}. You can pay securely on the link. Let us know once it's done." },
];
