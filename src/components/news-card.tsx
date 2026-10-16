import type { Article } from "@/db/schema";

type NewsCardProps = {
  article: Article;
  categoryName: string;
};

// 한국 시간 기준 YYYY.MM.DD
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(date: Date | null) {
  if (!date) return null;
  return dateFormatter
    .formatToParts(date)
    .filter((p) => p.type !== "literal")
    .map((p) => p.value)
    .join(".");
}

export function NewsCard({ article, categoryName }: NewsCardProps) {
  const published = formatDate(article.publishedAt);

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {categoryName}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {article.source}
          {published && ` · ${published}`}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
        {article.titleKo}
      </h2>

      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          원문 보기 ↗
        </a>
        {article.notionSaved ? (
          article.notionPageUrl ? (
            <a
              href={article.notionPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              ✓ 저장됨
            </a>
          ) : (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ✓ 저장됨
            </span>
          )
        ) : (
          // Notion 저장 기능은 아직 구현 전이라 비활성 상태로 표시한다.
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Notion 저장
          </button>
        )}
      </div>
    </article>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
