import type { Article } from "@/db/schema";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { SaveToNotionButton } from "@/components/save-to-notion-button";

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
    <article className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <DeleteArticleButton articleId={article.id} />
      <div className="flex items-center justify-between gap-2 pr-7">
        <span className="min-w-0 truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {categoryName}
        </span>
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
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
          className="inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 hover:underline sm:min-h-0 dark:text-indigo-400"
        >
          원문 보기 ↗
        </a>
        <SaveToNotionButton
          articleId={article.id}
          initialSaved={article.notionSaved}
          initialPageUrl={article.notionPageUrl}
        />
      </div>
    </article>
  );
}

export function NewsCardSkeleton() {
  return (
    // 실제 카드와 같은 구조(태그·출처 줄 / 제목 2줄 / 요약 3줄 / 하단 액션)로 높이 차이를 줄인다.
    <div className="flex h-full animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-3 h-5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-5 w-3/5 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
