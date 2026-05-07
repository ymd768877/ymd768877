import { ReactNode } from "react";
import { TopHeader } from "./TopHeader";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-black">
      <div className="w-full max-w-[420px] bg-background min-h-[100dvh] relative flex flex-col shadow-2xl overflow-x-hidden">
        <TopHeader />
        <main className="flex-1 w-full pt-16 pb-20 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
