"use client";

import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, type ReactNode } from "react";

// 로그인 여부를 클라이언트 상태로 판단한다.
// 로그인 전에는 로그인 모달을 자동으로 열고, 로그인 후에는 children을 보여준다.
export function SignInGate({ children }: { children: ReactNode }) {
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const opened = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      opened.current = false;
      return;
    }
    if (!opened.current) {
      opened.current = true;
      openSignIn();
    }
  }, [isLoaded, isSignedIn, openSignIn]);

  if (!isLoaded) return null;
  if (isSignedIn) return <>{children}</>;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        해외 AI 뉴스를 한국어로 보려면 로그인하세요.
      </p>
      <SignInButton mode="modal">
        <button className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black">
          로그인
        </button>
      </SignInButton>
    </div>
  );
}
