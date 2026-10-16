import Link from "next/link";
import type { Category } from "@/db/schema";

type CategoryBarProps = {
  categories: Category[];
  counts: Map<number | null, number>;
  total: number;
  // null = 전체
  selectedId: number | null;
};

const chipBase =
  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition whitespace-nowrap";
const chipIdle =
  "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
const chipActive = "border-indigo-600 bg-indigo-600 text-white";

export function CategoryBar({
  categories,
  counts,
  total,
  selectedId,
}: CategoryBarProps) {
  return (
    <div
      role="group"
      aria-label="카테고리 필터"
      className="flex flex-wrap items-center gap-2"
    >
      <Link
        href="/dashboard"
        aria-current={selectedId === null ? "true" : undefined}
        className={`${chipBase} ${selectedId === null ? chipActive : chipIdle}`}
      >
        전체 <span className="text-xs opacity-70">{total}</span>
      </Link>

      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/dashboard?category=${c.id}`}
          aria-current={selectedId === c.id ? "true" : undefined}
          className={`${chipBase} ${selectedId === c.id ? chipActive : chipIdle}`}
        >
          {c.name}{" "}
          <span className="text-xs opacity-70">{counts.get(c.id) ?? 0}</span>
        </Link>
      ))}

      {/* 카테고리 추가 기능은 아직 구현 전이라 비활성 상태로 표시한다. */}
      <button
        type="button"
        disabled
        title="준비 중"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-400"
      >
        <span aria-hidden="true">+</span> 카테고리 추가
      </button>
    </div>
  );
}
