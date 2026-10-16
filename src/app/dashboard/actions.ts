"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, type NewArticle } from "@/db/schema";
import { fetchFeed } from "@/lib/rss/fetch-feed";
import { FEED_SOURCES } from "@/lib/rss/sources";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export type FetchNewsResult = {
  added: number;
  skipped: number;
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
  const rows = new Map<string, NewArticle>(); // url 기준 중복 제거

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[fetchNews] ${FEED_SOURCES[i].name} 실패:`, r.reason);
      failedSources.push(FEED_SOURCES[i].name);
      return;
    }
    for (const item of r.value) {
      if (item.publishedAt.getTime() < cutoff || rows.has(item.url)) continue;
      rows.set(item.url, {
        userId,
        url: item.url,
        originalTitle: item.title,
        // Claude 번역·요약 단계 전까지는 원문으로 임시 저장한다.
        titleKo: item.title,
        summaryKo: item.summary,
        source: item.source,
        publishedAt: item.publishedAt,
      });
    }
  });

  let added = 0;
  if (rows.size > 0) {
    const inserted = await db
      .insert(articles)
      .values([...rows.values()])
      .onConflictDoNothing({ target: [articles.userId, articles.url] })
      .returning({ id: articles.id });
    added = inserted.length;
  }

  if (added > 0) revalidatePath("/dashboard");

  return { added, skipped: rows.size - added, failedSources };
}
