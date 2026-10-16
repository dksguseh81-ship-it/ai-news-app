"use client";

import { useState, useTransition } from "react";
import { fetchNews, type FetchNewsResult } from "@/app/dashboard/actions";

type Message = { tone: "ok" | "warn" | "error"; text: string };

function toMessage(r: FetchNewsResult): Message {
  const failed = r.failedSources.length;
  if (failed > 0) {
    return {
      tone: "warn",
      text: `${r.added}건 추가, ${failed}개 소스 실패 (${r.failedSources.join(", ")})`,
    };
  }
  return {
    tone: "ok",
    text: r.added > 0 ? `${r.added}건 추가됨` : "새로 추가된 기사가 없어요",
  };
}

const toneClass: Record<Message["tone"], string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

export function FetchNewsButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      try {
        setMessage(toMessage(await fetchNews()));
      } catch (e) {
        console.error("[fetchNews]", e);
        const detail =
          process.env.NODE_ENV !== "production" && e instanceof Error
            ? ` (${e.message})`
            : "";
        setMessage({
          tone: "error",
          text: `뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.${detail}`,
        });
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span role="status" className={`max-w-[9rem] text-xs sm:max-w-none sm:text-sm ${message ? toneClass[message.tone] : ""}`}>
        {message?.text}
      </span>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
      >
        {pending && (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {pending ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
    </div>
  );
}
