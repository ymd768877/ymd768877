import { useGetMyTransactions, useGetMe } from "@workspace/api-client-react";
import { Trophy, ArrowDownCircle, ArrowUpCircle, CreditCard, MinusCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
        status === "approved" && "bg-green-500/20 text-green-400 border border-green-500/30",
        status === "pending" && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        status === "rejected" && "bg-red-500/20 text-red-400 border border-red-500/30"
      )}
    >
      {status}
    </span>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === "deposit") return <ArrowDownCircle className="w-5 h-5 text-green-400" />;
  if (type === "withdrawal") return <ArrowUpCircle className="w-5 h-5 text-red-400" />;
  if (type === "credit") return <CreditCard className="w-5 h-5 text-primary" />;
  return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
}

export default function Transactions() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: transactions, isLoading } = useGetMyTransactions();

  if (!user) {
    return (
      <div className="p-6 text-center space-y-4">
        <Trophy className="w-12 h-12 text-primary mx-auto" />
        <p className="text-muted-foreground">Login to view your transaction history.</p>
        <Button asChild className="w-full font-bold">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground">HISTORY</h1>
      </div>

      <div className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Balance</span>
        <span className="text-xl font-black text-primary">Tk {user.balance.toFixed(2)}</span>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading transactions...</div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-secondary border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shrink-0">
                <TypeIcon type={tx.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground capitalize">{tx.type}</span>
                  <span className={cn(
                    "font-black text-base",
                    tx.type === "deposit" || tx.type === "credit" ? "text-green-400" : "text-red-400"
                  )}>
                    {tx.type === "deposit" || tx.type === "credit" ? "+" : "-"}Tk {Number(tx.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-BD", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </span>
                  <StatusBadge status={tx.status} />
                </div>
                {tx.note && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{tx.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary rounded-xl border border-border">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No transactions yet.</p>
          <Button asChild variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/10">
            <Link href="/deposit">Make a Deposit</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
