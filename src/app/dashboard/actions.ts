"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, type NewArticle } from "@/db/schema";
import { enrichArticle, FALLBACK_CATEGORY } from "@/lib/ai/enrich-article";
import { runPool } from "@/lib/ai/run-pool";
import { fetchFeed, type FeedItem } from "@/lib/rss/fetch-feed";
import { FEED_SOURCES } from "@/lib/rss/sources";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const PER_FEED_LIMIT = 10;
const CONCURRENCY = 4;

export type FetchNewsResult = {
  added: number;
  skipped: number;
  failed: number;
  failedSources: string[];
};

export async function fetchNews(): Promise<FetchNewsResult> {
  const { userId } = await auth();
  if (!userId) {
    console.error("[fetchNews] auth() returned no userId");
    throw new Error("Unauthorized");
  }

  const results = await Promise.allSettled(FEED_SOURCES.map(fetchFeed));

  const failedSources: string[] = [];
  const cutoff = Date.now() - WINDOW_MS;
  const candidates = new Map<string, FeedItem>(); // url 기준 중복 제거

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[fetchNews] ${FEED_SOURCES[i].name} 실패:`, r.reason);
      failedSources.push(FEED_SOURCES[i].name);
      return;
    }
    r.value
      .filter((item) => item.publishedAt.getTime() >= cutoff)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, PER_FEED_LIMIT)
      .forEach((item) => {
        if (!candidates.has(item.url)) candidates.set(item.url, item);
      });
  });

  // Claude를 부르기 전에 이미 저장된 URL을 제외한다.
  const urls = [...candidates.keys()];
  if (urls.length > 0) {
    const existing = await db
      .select({ url: articles.url })
      .from(articles)
      .where(and(eq(articles.userId, userId), inArray(articles.url, urls)));
    existing.forEach((e) => candidates.delete(e.url));
  }
  const skipped = urls.length - candidates.size;
  if (candidates.size === 0) return { added: 0, skipped, failed: 0, failedSources };

  // "기타"는 항상 존재해야 하므로 없으면 만든다.
  await db
    .insert(categories)
    .values({ userId, name: FALLBACK_CATEGORY, description: "분류되지 않은 기사" })
    .onConflictDoNothing();
  const userCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  const categoryIds = new Map(userCategories.map((c) => [c.name, c.id]));
  const categoryNames = userCategories.map((c) => c.name);

  const items = [...candidates.values()];
  const enriched = await runPool(items, CONCURRENCY, (item) =>
    enrichArticle(item, categoryNames),
  );

  const rows: NewArticle[] = [];
  let failed = 0;
  enriched.forEach((r, i) => {
    const item = items[i];
    if (!r.ok) {
      console.error(`[fetchNews] 처리 실패 ${item.url}:`, r.error);
      failed++;
      return;
    }
    rows.push({
      userId,
      url: item.url,
      originalTitle: item.title,
      titleKo: r.value.titleKo,
      summaryKo: r.value.summaryKo,
      source: item.source,
      publishedAt: item.publishedAt,
      categoryId: categoryIds.get(r.value.category) ?? null,
    });
  });

  let added = 0;
  if (rows.length > 0) {
    const inserted = await db
      .insert(articles)
      .values(rows)
      .onConflictDoNothing({ target: [articles.userId, articles.url] })
      .returning({ id: articles.id });
    added = inserted.length;
  }

  if (added > 0) revalidatePath("/dashboard");

  return { added, skipped: skipped + rows.length - added, failed, failedSources };
}
