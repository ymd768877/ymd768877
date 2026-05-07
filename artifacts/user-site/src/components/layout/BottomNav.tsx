import { Link, useLocation } from "wouter";
import { Home, Gift, Users, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/promotion", label: "Promotion", icon: Gift },
    { href: "/invite", label: "Invite", icon: Users },
    { href: "/transactions", label: "History", icon: Trophy },
    { href: "/member", label: "Member", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none">
      <div className="w-full max-w-[420px] bg-secondary/95 backdrop-blur-md border-t border-border flex items-center justify-between px-2 py-2 pointer-events-auto shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
