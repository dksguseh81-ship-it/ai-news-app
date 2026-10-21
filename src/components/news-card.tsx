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
    // hover 시 살짝 떠오르고 테두리에 강조색이 스민다. 모션 감소 설정에서는 이동만 끈다.
    <article className="group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 ease-out hover:border-indigo-200 hover:shadow-lg motion-safe:hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40">
      <DeleteArticleButton articleId={article.id} />

      {/* 메타: 분류 태그는 왼쪽, 출처·날짜는 보조 정보로 오른쪽에 낮은 대비로 둔다 */}
      <div className="flex items-center justify-between gap-3 pr-7">
        <span className="min-w-0 truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {categoryName}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {article.source}
          {published && article.publishedAt && (
            <>
              <span aria-hidden="true"> · </span>
              <time dateTime={article.publishedAt.toISOString()}>{published}</time>
            </>
          )}
        </span>
      </div>

      {/* 제목이 시선의 첫 지점이 되도록 크기·굵기·자간으로 요약과 분명히 구분한다 */}
      <h2 className="mt-4 line-clamp-3 text-[1.0625rem] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
        {article.titleKo}
      </h2>

      <p className="mt-2.5 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {article.summaryKo}
      </p>

      {/* 액션은 구분선 아래로 분리해 본문 읽기 흐름과 섞이지 않게 한다 */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex min-h-11 items-center gap-1 rounded text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-0 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            원문 보기
            <span
              aria-hidden="true"
              className="transition-transform duration-200 motion-safe:group-hover/link:-translate-y-0.5 motion-safe:group-hover/link:translate-x-0.5"
            >
              ↗
            </span>
          </a>
          <SaveToNotionButton
            articleId={article.id}
            initialSaved={article.notionSaved}
            initialPageUrl={article.notionPageUrl}
          />
        </div>
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
      <div className="mt-4 h-5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-5 w-3/5 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
