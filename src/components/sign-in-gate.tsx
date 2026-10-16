"use client";

import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const AFTER_SIGN_IN_URL = "/dashboard";

// 로그인 전에는 로그인 모달을 자동으로 열고, 로그인하면 대시보드로 이동한다.
export function SignInGate() {
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      opened.current = false;
      router.replace(AFTER_SIGN_IN_URL);
      return;
    }
    if (!opened.current) {
      opened.current = true;
      openSignIn({ forceRedirectUrl: AFTER_SIGN_IN_URL });
    }
  }, [isLoaded, isSignedIn, openSignIn, router]);

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        해외 AI 뉴스를 한국어로 보려면 로그인하세요.
      </p>
      <SignInButton mode="modal" forceRedirectUrl={AFTER_SIGN_IN_URL}>
        <button className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black">
          로그인
        </button>
      </SignInButton>
    </div>
  );
}
