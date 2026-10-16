import { XMLParser } from "fast-xml-parser";
import type { FeedSource } from "./sources";

export type FeedItem = {
  url: string;
  title: string;
  summary: string;
  publishedAt: Date;
  source: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
});

const SUMMARY_MAX = 300;

// 파서 결과 값(문자열 | {#text} | 객체 | 배열)에서 텍스트만 꺼낸다.
function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object") return text((value as Record<string, unknown>)["#text"]);
  return "";
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  "#8230": "…",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// 쿼리스트링·해시(트래킹 파라미터)를 제거해 같은 기사가 같은 URL로 저장되게 한다.
export function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

// Atom <link>는 여러 개일 수 있고 href 속성에 URL이 있다. RSS <link>는 텍스트다.
function extractLink(link: unknown): string {
  const links = toArray(link as unknown);
  for (const l of links) {
    if (typeof l === "string") return l;
    if (l && typeof l === "object") {
      const o = l as Record<string, unknown>;
      const rel = o["@_rel"];
      if (typeof o["@_href"] === "string" && (!rel || rel === "alternate")) {
        return o["@_href"];
      }
    }
  }
  return "";
}

export function parseFeed(xml: string, source: FeedSource): FeedItem[] {
  const doc = parser.parse(xml);
  // RSS 2.0: rss.channel.item / Atom: feed.entry
  const rawItems: Record<string, unknown>[] = doc?.rss?.channel
    ? toArray(doc.rss.channel.item)
    : toArray(doc?.feed?.entry);

  const items: FeedItem[] = [];
  for (const it of rawItems) {
    const url = normalizeUrl(extractLink(it.link));
    const title = stripHtml(text(it.title));
    const publishedAt = new Date(
      text(it.pubDate) || text(it.published) || text(it.updated),
    );
    if (!url || !title || Number.isNaN(publishedAt.getTime())) continue;

    const summary = truncate(
      stripHtml(text(it.description) || text(it.summary) || text(it.content)),
      SUMMARY_MAX,
    );

    items.push({
      url,
      title,
      // 요약이 비어 있으면 NOT NULL 컬럼을 위해 제목으로 대체한다.
      summary: summary || title,
      publishedAt,
      source: source.name,
    });
  }
  return items;
}

export async function fetchFeed(source: FeedSource): Promise<FeedItem[]> {
  const res = await fetch(source.url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "ai-news-collector/0.1" },
  });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);
  return parseFeed(await res.text(), source);
}
