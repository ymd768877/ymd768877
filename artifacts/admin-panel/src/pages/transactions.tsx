import { useState } from "react";
import { useGetAdminTransactions, useUpdateTransactionStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, Check, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
      status === "approved" && "bg-green-500/15 text-green-500 border border-green-500/20",
      status === "pending" && "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20",
      status === "rejected" && "bg-red-500/15 text-red-500 border border-red-500/20"
    )}>
      {status}
    </span>
  );
}

export default function Transactions() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: transactions, isLoading } = useGetAdminTransactions(
    filter === "all" ? {} : { status: filter as "pending" | "approved" | "rejected" }
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

  const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ArrowDownCircle className="w-6 h-6 text-primary" />
          Deposit Requests
        </h1>
        <p className="text-sm text-muted-foreground">{transactions?.length ?? 0} records</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              filter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground"
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
            return (
              <div key={tx.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{user?.username ?? `User #${tx.userId}`}</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">Phone: {user?.phone ?? "—"}</div>
                    {tx.senderPhone && (
                      <div className="text-xs text-muted-foreground">Sent from: {tx.senderPhone}</div>
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
                      <div className="text-xl font-black text-primary">Tk {Number(tx.amount).toFixed(0)}</div>
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
                          Approve
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
              No {filter !== "all" ? filter : ""} transactions
            </div>
          )}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialog !== null} onOpenChange={(open) => { if (!open) setRejectDialog(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
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
