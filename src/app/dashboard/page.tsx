import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import {
  CategoryBar,
  FilterProvider,
  PendingList,
  type CategoryItem,
} from "@/components/dashboard-filter";
import { EmptyState } from "@/components/empty-state";
import { NewsCard, NewsCardSkeleton } from "@/components/news-card";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            AI 뉴스 수집기
          </h1>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth.protect();
  const params = await searchParams;

  const [userCategories, countRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.id),
    db
      .select({ categoryId: articles.categoryId, n: count() })
      .from(articles)
      .where(eq(articles.userId, userId))
      .groupBy(articles.categoryId),
  ]);

  const counts = new Map<number | null, number>(
    countRows.map((r) => [r.categoryId, r.n]),
  );
  const total = countRows.reduce((sum, r) => sum + r.n, 0);

  // ?category=<id> — 본인 카테고리에 없는 값이면 "전체"로 처리
  const raw = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const requestedId = raw ? Number(raw) : null;
  const selectedId =
    requestedId !== null && userCategories.some((c) => c.id === requestedId)
      ? requestedId
      : null;

  // 최신순: 발행일 내림차순(발행일 없는 기사는 뒤로), 같으면 수집 시각 내림차순
  const list = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.userId, userId),
        selectedId !== null ? eq(articles.categoryId, selectedId) : undefined,
      ),
    )
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt));

  const categoryNames = new Map(userCategories.map((c) => [c.id, c.name]));

  const items: CategoryItem[] = [
    { id: null, name: "전체", count: total },
    ...userCategories.map((c) => ({
      id: c.id,
      name: c.name,
      count: counts.get(c.id) ?? 0,
    })),
  ];

  return (
    <FilterProvider selectedId={selectedId}>
      <CategoryBar items={items} />

      <PendingList>
        {list.length === 0 ? (
          <EmptyState filtered={selectedId !== null} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                categoryName={
                  (article.categoryId &&
                    categoryNames.get(article.categoryId)) ||
                  "기타"
                }
              />
            ))}
          </div>
        )}
      </PendingList>
    </FilterProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="뉴스를 불러오는 중" className="space-y-6">
      <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:px-0">
        {[56, 88, 96, 104, 80].map((w, i) => (
          <div
            key={i}
            style={{ width: w }}
            className="h-11 shrink-0 animate-pulse rounded-full bg-slate-200 sm:h-9 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
