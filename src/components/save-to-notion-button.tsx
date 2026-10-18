"use client";

import { useState, useTransition } from "react";
import { saveToNotion } from "@/app/dashboard/notion-actions";

type SaveToNotionButtonProps = {
  articleId: number;
  initialSaved: boolean;
  initialPageUrl: string | null;
};

const savedClass =
  "inline-flex min-h-11 items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 sm:min-h-0";

export function SaveToNotionButton({
  articleId,
  initialSaved,
  initialPageUrl,
}: SaveToNotionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialSaved);
  const [pageUrl, setPageUrl] = useState(initialPageUrl);
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await saveToNotion(articleId);
        if (result.ok) {
          setSaved(true);
          setPageUrl(result.pageUrl);
        } else {
          console.error("[saveToNotion]", result.error);
          setFailed(true);
        }
      } catch (e) {
        console.error("[saveToNotion]", e);
        setFailed(true);
      }
    });
  }

  if (saved) {
    return pageUrl ? (
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${savedClass} hover:underline`}
      >
        ✓ 저장됨
      </a>
    ) : (
      <span className={savedClass}>✓ 저장됨</span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 ${
        failed
          ? "border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-slate-800"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      }`}
    >
      {pending && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      <span role="status">
        {pending ? "저장 중…" : failed ? "저장 실패 · 다시 시도" : "뉴스 저장"}
      </span>
    </button>
  );
}
