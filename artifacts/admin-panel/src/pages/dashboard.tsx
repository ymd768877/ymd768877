import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Users, ArrowDownCircle, Wallet, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", accent ?? "bg-primary/10")}>
        <Icon className={cn("w-6 h-6", accent ? "text-white" : "text-primary")} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
        status === "approved" && "bg-green-500/15 text-green-500 border border-green-500/20",
        status === "pending" && "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20",
        status === "rejected" && "bg-red-500/15 text-red-500 border border-red-500/20"
      )}
    >
      {status}
    </span>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label="Active Users" value={stats?.activeUsers ?? 0} icon={Users} accent="bg-green-500" />
        <StatCard label="Pending Deposits" value={stats?.pendingDeposits ?? 0} icon={Clock} accent="bg-yellow-500" />
        <StatCard label="Total Deposited" value={`Tk ${(stats?.totalDeposited ?? 0).toFixed(0)}`} icon={TrendingUp} accent="bg-blue-500" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownCircle className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Recent Deposits</h2>
          </div>
          <div className="space-y-3">
            {stats?.recentTransactions?.filter(t => t.type === "deposit").slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{(tx as any).user?.username ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">Tk {Number(tx.amount).toFixed(0)}</span>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Recent Users</h2>
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{u.phone}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">Tk {Number(u.balance).toFixed(0)}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    u.status === "active"
                      ? "bg-green-500/15 text-green-500 border border-green-500/20"
                      : "bg-red-500/15 text-red-500 border border-red-500/20"
                  )}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
        <Wallet className="w-8 h-8 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total User Balance</div>
          <div className="text-3xl font-black text-primary">Tk {(stats?.totalBalance ?? 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
