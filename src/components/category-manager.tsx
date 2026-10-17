"use client";

import { useRef, useState, useTransition } from "react";
import {
  addCategory,
  deleteCategory,
  renameCategory,
  type CategoryResult,
} from "@/app/dashboard/category-actions";

export type ManagedCategory = { id: number; name: string; count: number };

const PROTECTED_NAME = "기타";

const inputClass =
  "min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 sm:min-h-9 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const smallBtn =
  "inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 dark:border-slate-700 dark:text-slate-300";

export function CategoryManager({
  categories,
}: {
  categories: ManagedCategory[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function run(action: () => Promise<CategoryResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const r = await action();
        if (r.ok) onSuccess?.();
        else setError(r.error);
      } catch (e) {
        console.error("[category]", e);
        setError("요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-slate-300 px-3.5 text-sm font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 sm:min-h-9 dark:border-slate-600 dark:text-slate-400"
      >
        <span aria-hidden="true">+</span> 카테고리 추가
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="category-dialog-title"
        onClick={(e) => {
          // 배경(backdrop) 클릭 시 닫는다.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl bg-white p-0 text-slate-700 shadow-xl backdrop:bg-slate-900/40 dark:bg-slate-900 dark:text-slate-300"
      >
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2
              id="category-dialog-title"
              className="text-base font-bold text-slate-900 dark:text-slate-50"
            >
              카테고리 관리
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={smallBtn}
            >
              닫기
            </button>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => addCategory(newName), () => setNewName(""));
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={20}
              placeholder="새 카테고리 이름"
              aria-label="새 카테고리 이름"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
            >
              추가
            </button>
          </form>

          <p role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {categories.map((c) => {
              const locked = c.name === PROTECTED_NAME;
              const editing = editingId === c.id;
              return (
                <li key={c.id} className="flex items-center gap-2">
                  {editing ? (
                    <form
                      className="flex min-w-0 flex-1 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(() => renameCategory(c.id, editName), () =>
                          setEditingId(null),
                        );
                      }}
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={20}
                        aria-label={`${c.name} 새 이름`}
                        className={inputClass}
                      />
                      <button
                        type="submit"
                        disabled={pending || !editName.trim()}
                        className={smallBtn}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={smallBtn}
                      >
                        취소
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          {c.count}
                        </span>
                      </span>
                      {locked ? (
                        <span className="text-xs text-slate-400">기본</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setError(null);
                              setEditingId(c.id);
                              setEditName(c.name);
                            }}
                            className={smallBtn}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `"${c.name}" 카테고리를 삭제할까요?\n기사 ${c.count}건은 "기타"로 옮겨져요.`,
                                )
                              ) {
                                run(() => deleteCategory(c.id));
                              }
                            }}
                            className={`${smallBtn} hover:border-red-300 hover:text-red-600`}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-slate-500">
            카테고리를 바꿔도 이미 저장된 기사는 다시 분류되지 않아요. 새로 가져오는
            기사부터 적용돼요.
          </p>
        </div>
      </dialog>
    </>
  );
}
