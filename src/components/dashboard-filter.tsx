"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useOptimistic,
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
  isPending: boolean;
  select: (id: number | null) => void;
};

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
  children,
}: {
  selectedId: number | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useOptimistic(selectedId);

  const select = (id: number | null) => {
    startTransition(() => {
      setOptimisticId(id);
      router.push(id === null ? "/dashboard" : `/dashboard?category=${id}`);
    });
  };

  return (
    <FilterContext value={{ selectedId: optimisticId, isPending, select }}>
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
  const { selectedId, select } = useFilter();

  return (
    <div
      role="group"
      aria-label="카테고리 필터"
      // 모바일: 한 줄 가로 스크롤(화면 끝까지), sm 이상: 줄바꿈
      className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = selectedId === item.id;
        const href =
          item.id === null ? "/dashboard" : `/dashboard?category=${item.id}`;
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
