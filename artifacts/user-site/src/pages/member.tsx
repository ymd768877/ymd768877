import { useGetMe, useLogout } from "@workspace/api-client-react";
import { User, LogOut, Wallet, Shield, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Member() {
  const [, setLocation] = useLocation();
  const { data: user, isError } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        queryClient.clear();
        toast({ title: "Logged out", description: "See you next time!" });
        setLocation("/");
      },
    },
  });

  if (!user || isError) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-black text-foreground">Member Area</h2>
        <p className="text-muted-foreground text-sm">Login to view your profile and account details.</p>
        <Button asChild className="w-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
          <Link href="/register">Register Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Avatar & Name */}
      <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-foreground">{user.username}</h2>
          <span className={`text-xs font-bold px-3 py-1 rounded-full mt-1 inline-block ${
            user.role === "admin"
              ? "bg-primary/20 text-primary border border-primary"
              : "bg-green-500/20 text-green-400 border border-green-500/30"
          }`}>
            {user.role === "admin" ? "ADMIN" : "MEMBER"}
          </span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Available Balance</div>
            <div className="text-xl font-black text-primary">Tk {Number(user.balance).toFixed(2)}</div>
          </div>
        </div>
        <Button asChild size="sm" className="font-bold rounded-full">
          <Link href="/deposit">Deposit</Link>
        </Button>
      </div>

      {/* Info */}
      <div className="bg-secondary border border-border rounded-xl divide-y divide-border">
        <div className="flex items-center gap-3 p-4">
          <Phone className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="text-sm font-bold text-foreground">{user.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Account Status</div>
            <div className={`text-sm font-bold ${user.status === "active" ? "text-green-400" : "text-red-400"}`}>
              {user.status === "active" ? "Active" : "Banned"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Member Since</div>
            <div className="text-sm font-bold text-foreground">
              {new Date(user.createdAt).toLocaleDateString("en-BD", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button asChild variant="outline" className="w-full border-border hover:border-primary hover:text-primary">
          <Link href="/transactions">Transaction History</Link>
        </Button>
        <Button
          variant="destructive"
          className="w-full font-bold"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
