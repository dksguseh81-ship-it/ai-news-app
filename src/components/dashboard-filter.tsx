"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { CategoryManager } from "./category-manager";

export type CategoryItem = {
  // null = 전체
  id: number | null;
  name: string;
  count: number;
};

type FilterState = {
  selectedId: number | null;
  query: string;
  isPending: boolean;
  select: (id: number | null) => void;
  search: (query: string) => void;
};

function dashboardHref(categoryId: number | null, query: string) {
  const params = new URLSearchParams();
  if (categoryId !== null) params.set("category", String(categoryId));
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

const FilterContext = createContext<FilterState | null>(null);

function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("FilterProvider 안에서만 사용할 수 있습니다");
  return ctx;
}

// 카테고리 칩과 카드 목록이 같은 "이동 중" 상태를 공유한다.
// 칩을 누르면 선택 표시를 즉시 바꾸고, 새 목록이 올 때까지 기존 목록을 흐리게 보여 준다.
export function FilterProvider({
  selectedId,
  query,
  children,
}: {
  selectedId: number | null;
  query: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useOptimistic(selectedId);
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(query);

  // 카테고리를 바꿔도 검색어는 유지하고, 둘 다 1페이지부터 다시 본다.
  const select = (id: number | null) => {
    startTransition(() => {
      setOptimisticId(id);
      router.push(dashboardHref(id, optimisticQuery));
    });
  };

  const search = (q: string) => {
    startTransition(() => {
      setOptimisticQuery(q);
      router.push(dashboardHref(optimisticId, q));
    });
  };

  return (
    <FilterContext
      value={{
        selectedId: optimisticId,
        query: optimisticQuery,
        isPending,
        select,
        search,
      }}
    >
      {children}
    </FilterContext>
  );
}

const chipBase =
  "inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition sm:min-h-9";
const chipIdle =
  "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
const chipActive = "border-indigo-600 bg-indigo-600 text-white";

export function CategoryBar({ items }: { items: CategoryItem[] }) {
  const managed = items.filter(
    (i): i is CategoryItem & { id: number } => i.id !== null,
  );
  const { selectedId, query, select } = useFilter();

  return (
    <div
      role="group"
      aria-label="카테고리 필터"
      // 모바일: 한 줄 가로 스크롤(화면 끝까지), sm 이상: 줄바꿈
      className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = selectedId === item.id;
        const href = dashboardHref(item.id, query);
        return (
          <Link
            key={item.id ?? "all"}
            href={href}
            aria-current={active ? "true" : undefined}
            onClick={(e) => {
              // 새 탭/창 열기 등 보조 키 클릭은 기본 동작에 맡긴다.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              select(item.id);
            }}
            className={`${chipBase} ${active ? chipActive : chipIdle}`}
          >
            {item.name}
            <span className="text-xs opacity-70">{item.count}</span>
          </Link>
        );
      })}

      <CategoryManager categories={managed} />
    </div>
  );
}

export function SearchBar() {
  const { query, search } = useFilter();
  // 뒤로 가기 등으로 검색어가 바뀌면 입력창도 맞춘다(렌더 중 상태 동기화).
  const [value, setValue] = useState(query);
  const [synced, setSynced] = useState(query);
  if (synced !== query) {
    setSynced(query);
    setValue(query);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        search(value.trim());
      }}
      className="ml-auto flex w-full gap-2 sm:w-1/3"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="키워드로 뉴스 검색"
        aria-label="뉴스 키워드 검색"
        maxLength={100}
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:min-h-9 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:min-h-9 dark:bg-indigo-500"
      >
        검색
      </button>
    </form>
  );
}

export function PendingList({ children }: { children: ReactNode }) {
  const { isPending } = useFilter();

  return (
    <div
      aria-busy={isPending}
      className={`transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </div>
  );
}
