import { useGetMe } from "@workspace/api-client-react";
import { Users, Copy, Share2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Invite() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();

  const referralCode = user ? `yasin666-${user.id}` : null;
  const referralLink = referralCode
    ? `${window.location.origin}${import.meta.env.BASE_URL}register?ref=${referralCode}`
    : null;

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
  }

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground">INVITE</h1>
      </div>

      {/* Banner */}
      <div className="bg-secondary border border-border rounded-2xl p-6 text-center space-y-2">
        <div className="text-4xl mb-3">🎁</div>
        <h2 className="text-xl font-black text-primary">Invite Friends & Earn</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Invite your friends to join yasin666. Both of you benefit when they register and start playing!
        </p>
      </div>

      {/* How it works */}
      <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-foreground">How it works</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Share your referral code or link with friends" },
            { step: "2", text: "Your friend registers using your code" },
            { step: "3", text: "Both of you get bonus rewards!" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shrink-0">
                {step}
              </span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {user && referralCode ? (
        <>
          {/* Referral Code */}
          <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your Referral Code</div>
            <div className="flex items-center justify-between bg-background border border-primary/40 rounded-lg px-4 py-3">
              <span className="text-lg font-black text-primary tracking-wider">{referralCode}</span>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your Referral Link</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 truncate">
                <span className="text-xs text-muted-foreground truncate block">{referralLink}</span>
              </div>
              <button
                onClick={copyLink}
                className="p-2 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={copyLink}
            className="w-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Invite Link
          </Button>
        </>
      ) : (
        <div className="bg-secondary border border-border rounded-xl p-6 text-center space-y-4">
          <Gift className="w-10 h-10 text-primary mx-auto" />
          <p className="text-muted-foreground">Login to get your personal referral code.</p>
          <Button asChild className="w-full font-bold">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
