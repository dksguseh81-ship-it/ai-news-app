import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import {
  CategoryBar,
  FilterProvider,
  PendingList,
  SearchBar,
  type CategoryItem,
} from "@/components/dashboard-filter";
import { EmptyState } from "@/components/empty-state";
import { FetchNewsButton } from "@/components/fetch-news-button";
import { NewsCountBadge } from "@/components/news-count-badge";
import { Pagination } from "@/components/pagination";
import { NewsCard, NewsCardSkeleton } from "@/components/news-card";

// 뉴스 가져오기(Server Action)가 Claude 호출로 오래 걸릴 수 있어 시간 제한을 늘린다.
export const maxDuration = 60;

const PAGE_SIZE = 9;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">AI 뉴스 수집기</h1>
          <div className="flex items-center gap-3">
            <FetchNewsButton />
            <UserButton />
          </div>
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

async function DashboardContent({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth.protect();
  const params = await searchParams;

  const [userCategories, countRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.id),
    db
      .select({ categoryId: articles.categoryId, n: count() })
      .from(articles)
      .where(eq(articles.userId, userId))
      .groupBy(articles.categoryId),
  ]);

  const counts = new Map<number | null, number>(countRows.map((r) => [r.categoryId, r.n]));
  const total = countRows.reduce((sum, r) => sum + r.n, 0);

  // ?category=<id> — 본인 카테고리에 없는 값이면 "전체"로 처리
  const raw = Array.isArray(params.category) ? params.category[0] : params.category;
  const requestedId = raw ? Number(raw) : null;
  const selectedId =
    requestedId !== null && userCategories.some((c) => c.id === requestedId) ? requestedId : null;

  // ?q=<키워드> — 한국어 제목·요약과 원문 제목에서 대소문자 구분 없이 찾는다
  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQ ?? "").trim().slice(0, 100);
  // LIKE 와일드카드(% _ \)는 글자 그대로 검색하도록 이스케이프한다
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;

  const where = and(
    eq(articles.userId, userId),
    selectedId !== null ? eq(articles.categoryId, selectedId) : undefined,
    query
      ? or(
          ilike(articles.titleKo, pattern),
          ilike(articles.summaryKo, pattern),
          ilike(articles.originalTitle, pattern),
        )
      : undefined,
  );

  // ?page=<n> — 범위를 벗어나거나 숫자가 아니면 가장 가까운 유효 페이지로 맞춘다
  let filteredTotal = selectedId === null ? total : (counts.get(selectedId) ?? 0);
  if (query) {
    const [row] = await db.select({ n: count() }).from(articles).where(where);
    filteredTotal = row.n;
  }
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number.parseInt(rawPage ?? "1", 10);
  const page = Math.min(Math.max(Number.isNaN(requestedPage) ? 1 : requestedPage, 1), totalPages);

  // 최신순: 발행일 내림차순(발행일 없는 기사는 뒤로), 같으면 수집 시각 내림차순
  const list = await db
    .select()
    .from(articles)
    .where(where)
    .orderBy(
      sql`${articles.publishedAt} desc nulls last`,
      desc(articles.createdAt),
      desc(articles.id), // 정렬 값이 같아도 페이지 사이에 순서가 흔들리지 않게 한다
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

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
    <FilterProvider selectedId={selectedId} query={query}>
      <div>
        <NewsCountBadge total={total} />
      </div>
      <SearchBar />
      <CategoryBar items={items} />

      <PendingList>
        {list.length === 0 ? (
          <EmptyState filtered={selectedId !== null} query={query} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  categoryName={
                    (article.categoryId && categoryNames.get(article.categoryId)) || "기타"
                  }
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} categoryId={selectedId} query={query} />
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
