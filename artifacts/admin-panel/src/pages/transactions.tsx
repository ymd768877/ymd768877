import { useState } from "react";
import { useGetAdminTransactions, useUpdateTransactionStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type TypeFilter = "all" | "deposit" | "withdrawal";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
      status === "approved" && "bg-green-500/15 text-green-600 border border-green-500/20",
      status === "pending" && "bg-yellow-500/15 text-yellow-600 border border-yellow-500/20",
      status === "rejected" && "bg-red-500/15 text-red-500 border border-red-500/20"
    )}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isWithdrawal = type === "withdrawal";
  return (
    <span className={cn(
      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1",
      isWithdrawal
        ? "bg-orange-500/15 text-orange-600 border border-orange-500/20"
        : "bg-blue-500/15 text-blue-600 border border-blue-500/20"
    )}>
      {isWithdrawal ? <ArrowUpCircle className="w-2.5 h-2.5" /> : <ArrowDownCircle className="w-2.5 h-2.5" />}
      {isWithdrawal ? "Withdraw" : "Deposit"}
    </span>
  );
}

export default function Transactions() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: allTransactions, isLoading } = useGetAdminTransactions(
    statusFilter === "all" ? {} : { status: statusFilter as "pending" | "approved" | "rejected" }
  );

  // Client-side type filter
  const transactions = allTransactions?.filter(tx =>
    typeFilter === "all" ? (tx.type === "deposit" || tx.type === "withdrawal") : tx.type === typeFilter
  );

  const [rejectDialog, setRejectDialog] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const updateStatus = useUpdateTransactionStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries();
        toast({ title: "Transaction updated" });
        setRejectDialog(null);
        setRejectNote("");
      },
      onError: (e: any) => {
        toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" });
      },
    },
  });

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "deposit", label: "Deposits" },
    { value: "withdrawal", label: "Withdrawals" },
  ];

  const pendingCount = allTransactions?.filter(t => t.status === "pending" && (t.type === "deposit" || t.type === "withdrawal")).length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ArrowDownCircle className="w-6 h-6 text-primary" />
          Transactions
          {pendingCount > 0 && (
            <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">{transactions?.length ?? 0} records</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              statusFilter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium border transition-all",
              typeFilter === value
                ? value === "withdrawal"
                  ? "bg-orange-500/15 text-orange-600 border-orange-500/40"
                  : value === "deposit"
                    ? "bg-blue-500/15 text-blue-600 border-blue-500/40"
                    : "bg-secondary text-foreground border-border"
                : "bg-card border-border text-muted-foreground hover:border-primary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions?.map((tx) => {
            const user = (tx as any).user;
            const isWithdrawal = tx.type === "withdrawal";
            return (
              <div key={tx.id} className={cn(
                "bg-card border rounded-xl p-4",
                isWithdrawal ? "border-orange-500/20" : "border-border"
              )}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{user?.username ?? `User #${tx.userId}`}</span>
                      <TypeBadge type={tx.type} />
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">Phone: {user?.phone ?? "—"}</div>
                    {tx.senderPhone && (
                      <div className="text-xs text-muted-foreground">
                        {isWithdrawal ? "Send to:" : "Sent from:"} <span className="font-mono font-bold text-foreground">{tx.senderPhone}</span>
                      </div>
                    )}
                    {tx.note && (
                      <div className="text-xs text-muted-foreground">Note: {tx.note}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString("en-BD")}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className={cn(
                        "text-xl font-black",
                        isWithdrawal ? "text-orange-500" : "text-primary"
                      )}>
                        {isWithdrawal ? "−" : "+"}Tk {Number(tx.amount).toFixed(0)}
                      </div>
                    </div>

                    {tx.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => updateStatus.mutate({
                            transactionId: tx.id,
                            data: { status: "approved" },
                          })}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isWithdrawal ? "Pay" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1"
                          onClick={() => setRejectDialog(tx.id)}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {transactions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              No {statusFilter !== "all" ? statusFilter : ""} {typeFilter !== "all" ? typeFilter : ""} transactions
            </div>
          )}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialog !== null} onOpenChange={(open) => { if (!open) setRejectDialog(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason (optional)</Label>
            <Input
              placeholder="Enter reason for rejection"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={() => {
                if (rejectDialog === null) return;
                updateStatus.mutate({
                  transactionId: rejectDialog,
                  data: { status: "rejected", note: rejectNote || undefined },
                });
              }}
            >
              {updateStatus.isPending ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
