"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <p>뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-4 font-medium text-red-700 transition hover:bg-red-100 sm:min-h-9 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}
