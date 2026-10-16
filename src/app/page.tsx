import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInGate } from "@/components/sign-in-gate";

export default async function Home() {
  // 이미 로그인한 사용자는 바로 대시보드로 보낸다.
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <SignInGate />;
}
