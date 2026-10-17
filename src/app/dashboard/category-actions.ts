"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { FALLBACK_CATEGORY } from "@/lib/ai/enrich-article";

const NAME_MAX = 20;

export type CategoryResult = { ok: true } | { ok: false; error: string };

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

function validateName(raw: string): { name: string } | { error: string } {
  const name = raw.trim();
  if (!name) return { error: "카테고리 이름을 입력해 주세요." };
  if (name.length > NAME_MAX) {
    return { error: `이름은 ${NAME_MAX}자 이하로 입력해 주세요.` };
  }
  return { name };
}

function isUniqueViolation(e: unknown) {
  const code = (e as { code?: string; cause?: { code?: string } })?.code
    ?? (e as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

export async function addCategory(rawName: string): Promise<CategoryResult> {
  const userId = await requireUserId();
  const v = validateName(rawName);
  if ("error" in v) return { ok: false, error: v.error };

  try {
    await db.insert(categories).values({ userId, name: v.name });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "이미 있는 카테고리 이름이에요." };
    }
    console.error("[addCategory]", e);
    return { ok: false, error: "카테고리를 추가하지 못했어요." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameCategory(
  id: number,
  rawName: string,
): Promise<CategoryResult> {
  const userId = await requireUserId();
  const v = validateName(rawName);
  if ("error" in v) return { ok: false, error: v.error };

  const [current] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  if (!current) return { ok: false, error: "카테고리를 찾을 수 없어요." };
  if (current.name === FALLBACK_CATEGORY) {
    return { ok: false, error: `"${FALLBACK_CATEGORY}"는 수정할 수 없어요.` };
  }

  try {
    await db
      .update(categories)
      .set({ name: v.name })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "이미 있는 카테고리 이름이에요." };
    }
    console.error("[renameCategory]", e);
    return { ok: false, error: "카테고리를 수정하지 못했어요." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

// 삭제하면 해당 카테고리의 기사는 "기타"로 옮긴다. 다른 기사는 재분류하지 않는다.
export async function deleteCategory(id: number): Promise<CategoryResult> {
  const userId = await requireUserId();

  const [current] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  if (!current) return { ok: false, error: "카테고리를 찾을 수 없어요." };
  if (current.name === FALLBACK_CATEGORY) {
    return { ok: false, error: `"${FALLBACK_CATEGORY}"는 삭제할 수 없어요.` };
  }

  try {
    await db
      .insert(categories)
      .values({ userId, name: FALLBACK_CATEGORY, description: "분류되지 않은 기사" })
      .onConflictDoNothing();
    const [fallback] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.userId, userId), eq(categories.name, FALLBACK_CATEGORY)),
      );

    await db
      .update(articles)
      .set({ categoryId: fallback.id })
      .where(and(eq(articles.userId, userId), eq(articles.categoryId, id)));
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  } catch (e) {
    console.error("[deleteCategory]", e);
    return { ok: false, error: "카테고리를 삭제하지 못했어요." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
