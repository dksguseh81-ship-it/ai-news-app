import { UserButton } from "@clerk/nextjs";
import { SignInGate } from "@/components/sign-in-gate";

export default function Home() {
  return (
    <SignInGate>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-lg font-semibold">AI 뉴스 수집기</h1>
          <UserButton />
        </header>
      </div>
    </SignInGate>
  );
}
