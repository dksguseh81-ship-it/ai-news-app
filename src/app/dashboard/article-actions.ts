"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";

export type DeleteArticleResult =
  | { ok: true }
  | { ok: false; status: 401 | 404 | 500; error: string };

export async function deleteArticle(articleId: number): Promise<DeleteArticleResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, error: "로그인이 필요해요." };

  try {
    const deleted = await db
      .delete(articles)
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)))
      .returning({ id: articles.id });

    revalidatePath("/dashboard");
    if (deleted.length === 0) {
      return { ok: false, status: 404, error: "이미 삭제되었거나 없는 뉴스예요." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[deleteArticle]", e);
    return {
      ok: false,
      status: 500,
      error: "뉴스를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
