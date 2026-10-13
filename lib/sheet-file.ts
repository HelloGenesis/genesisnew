/**
 * READING A SPREADSHEET FILE IN THE BROWSER: .xlsx (the zip of XML Excel saves)
 * and .csv. No library: the zip's entries are inflated with the browser's own
 * DecompressionStream, and the XML read with DOMParser. Every tab comes back as
 * rows of text.
 */

export type SheetTab = { name: string; rows: string[][] };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  const sep = (src.split("\n")[0]?.split(";").length ?? 0) > (src.split("\n")[0]?.split(",").length ?? 0) ? ";" : ",";
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endCell();
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) {
    endCell();
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function unzip(buf: ArrayBuffer): Promise<Map<string, () => Promise<string>>> {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000) && eocd < 0; i--) if (v.getUint32(i, true) === 0x06054b50) eocd = i;
  if (eocd < 0) throw new Error("That isn't an .xlsx file. In Excel, use File → Save As → Excel Workbook (.xlsx), or CSV.");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files = new Map<string, () => Promise<string>>();
  const utf8 = new TextDecoder();
  for (let n = 0; n < count && v.getUint32(p, true) === 0x02014b50; n++) {
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = utf8.decode(new Uint8Array(buf, p + 46, nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const data = new Uint8Array(buf, start, size);
    files.set(name, async () => {
      if (method === 0) return utf8.decode(data);
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Response(stream).text();
    });
  }
  return files;
}

const colIndex = (ref: string) => {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
  return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
};

export async function parseXlsx(buf: ArrayBuffer): Promise<SheetTab[]> {
  const files = await unzip(buf);
  const xml = async (path: string) => {
    const read = files.get(path);
    return read ? new DOMParser().parseFromString(await read(), "application/xml") : null;
  };
  const all = (doc: Document | Element, tag: string) => Array.from(doc.getElementsByTagNameNS("*", tag));
  const strings = (await xml("xl/sharedStrings.xml")) ?? null;
  const shared = strings ? all(strings, "si").map((si) => all(si, "t").filter((t) => t.parentElement?.localName !== "rPh").map((t) => t.textContent ?? "").join("")) : [];
  const workbook = await xml("xl/workbook.xml");
  const rels = await xml("xl/_rels/workbook.xml.rels");
  const target = new Map((rels ? all(rels, "Relationship") : []).map((r) => [r.getAttribute("Id"), r.getAttribute("Target") ?? ""]));
  const sheets = workbook ? all(workbook, "sheet") : [];
  const tabs: SheetTab[] = [];
  for (const sheet of sheets) {
    const rid = sheet.getAttribute("r:id") ?? Array.from(sheet.attributes).find((a) => a.localName === "id")?.value;
    const t = target.get(rid ?? "") ?? "";
    const path = t.startsWith("/") ? t.slice(1) : `xl/${t.replace(/^\.\//, "")}`;
    const doc = await xml(path);
    if (!doc) continue;
    const rows: string[][] = [];
    for (const r of all(doc, "row")) {
      const out: string[] = [];
      for (const c of all(r, "c")) {
        const type = c.getAttribute("t");
        const value = all(c, "v")[0]?.textContent ?? "";
        const text = type === "s" ? (shared[Number(value)] ?? "") : type === "inlineStr" ? all(c, "t").map((x) => x.textContent ?? "").join("") : type === "b" ? (value === "1" ? "TRUE" : "FALSE") : value;
        out[colIndex(c.getAttribute("r") ?? "")] = text;
      }
      if (out.some((x) => x && x.trim())) rows.push(Array.from(out, (x) => x ?? ""));
    }
    tabs.push({ name: sheet.getAttribute("name") ?? `Sheet ${tabs.length + 1}`, rows });
  }
  return tabs.filter((t) => t.rows.length);
}

export async function readSheetFile(file: File): Promise<SheetTab[]> {
  if (/\.(csv|tsv|txt)$/i.test(file.name)) {
    const text = await file.text();
    return [{ name: file.name.replace(/\.\w+$/, ""), rows: /\.tsv$/i.test(file.name) ? text.split(/\r?\n/).filter(Boolean).map((l) => l.split("\t")) : parseCsv(text) }];
  }
  if (/\.xls$/i.test(file.name)) throw new Error("Old .xls files can't be read. In Excel, use File → Save As → Excel Workbook (.xlsx).");
  return parseXlsx(await file.arrayBuffer());
}
