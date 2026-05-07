import { useState } from "react";
import { useGetAdminUsers, useUpdateUserBalance, useUpdateUserStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Search, Plus, Minus, Ban, CheckCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type BalanceType = "add" | "subtract" | "set";

export default function UsersPage() {
  const { data: users, isLoading } = useGetAdminUsers();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const [balanceDialog, setBalanceDialog] = useState<{ userId: number; username: string } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<BalanceType>("add");

  const updateBalance = useUpdateUserBalance({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries();
        toast({ title: `Balance updated for ${data.username}`, description: `New balance: Tk ${Number(data.balance).toFixed(2)}` });
        setBalanceDialog(null);
        setBalanceAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" });
      },
    },
  });

  const updateStatus = useUpdateUserStatus({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries();
        toast({ title: `User ${data.status === "banned" ? "banned" : "activated"}` });
      },
      onError: (e: any) => {
        toast({ title: "Failed", description: e?.response?.data?.error, variant: "destructive" });
      },
    },
  });

  const filtered = users?.filter(
    (u) =>
      u.role !== "admin" &&
      (u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Users
          </h1>
          <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((user) => (
            <div key={user.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{user.username}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    user.status === "active"
                      ? "bg-green-500/15 text-green-500 border border-green-500/20"
                      : "bg-red-500/15 text-red-500 border border-red-500/20"
                  )}>
                    {user.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{user.phone}</div>
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(user.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right mr-2">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="font-black text-primary">Tk {Number(user.balance).toFixed(2)}</div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-border gap-1"
                  onClick={() => setBalanceDialog({ userId: user.id, username: user.username })}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Balance
                </Button>

                {user.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1"
                    onClick={() => updateStatus.mutate({ userId: user.id, data: { status: "banned" } })}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Ban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500/30 text-green-500 hover:bg-green-500/10 gap-1"
                    onClick={() => updateStatus.mutate({ userId: user.id, data: { status: "active" } })}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filtered?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              No users found
            </div>
          )}
        </div>
      )}

      {/* Balance Dialog */}
      <Dialog open={!!balanceDialog} onOpenChange={(open) => { if (!open) setBalanceDialog(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Manage Balance — {balanceDialog?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Operation</Label>
              <Select value={balanceType} onValueChange={(v) => setBalanceType(v as BalanceType)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-green-500" /> Add to Balance</span>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <span className="flex items-center gap-2"><Minus className="w-4 h-4 text-red-500" /> Subtract from Balance</span>
                  </SelectItem>
                  <SelectItem value="set">
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-500" /> Set Balance</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (Tk)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(null)}>Cancel</Button>
            <Button
              disabled={!balanceAmount || updateBalance.isPending}
              onClick={() => {
                if (!balanceDialog || !balanceAmount) return;
                updateBalance.mutate({
                  userId: balanceDialog.userId,
                  data: { amount: Number(balanceAmount), type: balanceType },
                });
              }}
            >
              {updateBalance.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
