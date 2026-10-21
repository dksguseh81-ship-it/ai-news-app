"use client";

import { useState, useTransition } from "react";
import { deleteArticle } from "@/app/dashboard/article-actions";

export function DeleteArticleButton({ articleId }: { articleId: number }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await deleteArticle(articleId);
        // 성공하면 서버 액션의 revalidatePath로 목록이 갱신되어 카드가 사라진다.
        if (!result.ok) {
          console.error("[deleteArticle]", result.status, result.error);
          // 404는 이미 삭제된 상태라 목록 갱신만 기다리면 된다.
          if (result.status !== 404) setFailed(true);
        }
      } catch (e) {
        console.error("[deleteArticle]", e);
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      aria-label={failed ? "삭제 실패 · 다시 시도" : "뉴스 삭제"}
      title={failed ? "삭제 실패 · 다시 시도" : "삭제"}
      // 데스크톱에서는 카드에 hover/포커스가 있을 때만 드러내 시선을 방해하지 않는다. 터치 기기(좁은 화면)는 항상 보인다.
      className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 focus-visible:opacity-100 disabled:sm:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 ${
        failed
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
