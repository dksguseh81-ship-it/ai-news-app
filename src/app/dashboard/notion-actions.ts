"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { FALLBACK_CATEGORY } from "@/lib/ai/enrich-article";
import { saveArticleToNotion } from "@/lib/notion/save-article";

export type SaveToNotionResult =
  | { ok: true; pageUrl: string }
  | { ok: false; error: string };

export async function saveToNotion(articleId: number): Promise<SaveToNotionResult> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 저장 전에 먼저 선점해서, 더블 클릭이나 동시 요청으로 페이지가 중복 생성되지 않게 한다.
  const [article] = await db
    .update(articles)
    .set({ notionSaved: true })
    .where(
      and(
        eq(articles.id, articleId),
        eq(articles.userId, userId),
        eq(articles.notionSaved, false),
      ),
    )
    .returning();
  if (!article) {
    return { ok: false, error: "이미 저장했거나 찾을 수 없는 기사예요." };
  }

  try {
    let categoryName = FALLBACK_CATEGORY;
    if (article.categoryId) {
      const [category] = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, article.categoryId));
      if (category) categoryName = category.name;
    }

    const pageUrl = await saveArticleToNotion(article, categoryName);
    await db
      .update(articles)
      .set({ notionPageUrl: pageUrl })
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)));
    revalidatePath("/dashboard");
    return { ok: true, pageUrl };
  } catch (e) {
    console.error("[saveToNotion]", e);
    // 실패하면 선점을 풀어 다시 시도할 수 있게 한다.
    await db
      .update(articles)
      .set({ notionSaved: false })
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)));
    const detail =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? ` (${e.message})`
        : "";
    return {
      ok: false,
      error: `Notion에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.${detail}`,
    };
  }
}
