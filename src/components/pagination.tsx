import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  categoryId: number | null;
  query: string;
};

function hrefFor(page: number, categoryId: number | null, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (categoryId !== null) params.set("category", String(categoryId));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

const SIBLINGS = 2; // 현재 페이지 앞뒤로 보여 줄 번호 수

// 첫/마지막 페이지와 현재 페이지 앞뒤 2개만 보여 주고, 이어지지 않는 구간은 "…"로 줄인다.
// 예: 1 … 48 49 [50] 51 52 … 100
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  const wanted = new Set([1, totalPages]);
  for (let n = page - SIBLINGS; n <= page + SIBLINGS; n++) wanted.add(n);
  const nums = [...wanted]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) items.push("gap");
    items.push(n);
  });
  return items;
}

const base =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition sm:min-h-9 sm:min-w-9";
const idle =
  "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
const active = "border-indigo-600 bg-indigo-600 text-white";
const disabled =
  "cursor-not-allowed border-slate-200 bg-white text-slate-400 opacity-50 dark:border-slate-700 dark:bg-slate-900";

export function Pagination({
  page,
  totalPages,
  categoryId,
  query,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="페이지 이동"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      <NavButton label="처음" target={1} enabled={page > 1} categoryId={categoryId} query={query} />
      <NavButton label="이전" target={page - 1} enabled={page > 1} categoryId={categoryId} query={query} />

      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item, categoryId, query)}
            aria-label={`${item}페이지`}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? active : idle}`}
          >
            {item}
          </Link>
        ),
      )}

      <NavButton label="다음" target={page + 1} enabled={page < totalPages} categoryId={categoryId} query={query} />
      <NavButton label="끝" target={totalPages} enabled={page < totalPages} categoryId={categoryId} query={query} />
    </nav>
  );
}

function NavButton({
  label,
  target,
  enabled,
  categoryId,
  query,
}: {
  label: string;
  target: number;
  enabled: boolean;
  categoryId: number | null;
  query: string;
}) {
  if (!enabled) {
    return (
      <span aria-disabled="true" className={`${base} ${disabled}`}>
        {label}
      </span>
    );
  }
  return (
    <Link href={hrefFor(target, categoryId, query)} className={`${base} ${idle}`}>
      {label}
    </Link>
  );
}
