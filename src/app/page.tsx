import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInGate } from "@/components/sign-in-gate";

// 요청 시점 데이터(auth)는 Suspense 안에서 읽어야 프리렌더링을 막지 않는다.
async function HomeContent() {
  // 이미 로그인한 사용자는 바로 대시보드로 보낸다.
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <SignInGate />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
