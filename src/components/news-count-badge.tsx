export function NewsCountBadge({ total }: { total: number }) {
  return (
    <p
      aria-live="polite"
      className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
    >
      총 {total.toLocaleString("ko-KR")}개의 뉴스
    </p>
  );
}
