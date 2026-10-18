import Link from "next/link";

// filtered: 특정 카테고리를 보고 있는데 기사가 없는 경우
// query: 검색어가 있는데 결과가 없는 경우
export function EmptyState({
  filtered,
  query,
}: {
  filtered: boolean;
  query: string;
}) {
  const searching = query !== "";
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 text-slate-300 dark:text-slate-600"
      >
        <path d="M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v14H6a2 2 0 0 1-2-2V5Z" />
        <path d="M17 8h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2h-1" />
        <path d="M7.5 8h6M7.5 11.5h6M7.5 15h3.5" />
      </svg>

      <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
        {searching
          ? `'${query}' 검색 결과가 없어요`
          : filtered
            ? "이 카테고리에는 기사가 없어요"
            : "아직 가져온 뉴스가 없어요"}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {searching
          ? "다른 키워드로 검색하거나 카테고리를 바꿔 보세요."
          : filtered
            ? "다른 카테고리를 고르거나 전체 기사를 확인해 보세요."
            : "뉴스를 가져오면 이곳에 카드로 표시돼요."}
      </p>

      {(filtered || searching) && (
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:min-h-9 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          전체 보기
        </Link>
      )}
    </div>
  );
}
