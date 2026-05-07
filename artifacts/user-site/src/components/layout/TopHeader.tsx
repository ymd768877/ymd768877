import { Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function TopHeader() {
  const { data: user, isError } = useGetMe({ query: { retry: false } });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none">
      <div className="w-full max-w-[420px] bg-background/90 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 pointer-events-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            WIN777
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user && !isError ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="text-sm font-bold text-primary">Tk {user.balance.toFixed(2)}</span>
              </div>
              <Button asChild size="sm" variant="secondary" className="rounded-full font-bold">
                <Link href="/deposit">Deposit</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary/20">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
