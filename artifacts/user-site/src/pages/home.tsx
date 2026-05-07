import { useState } from "react";
import { Link } from "wouter";
import { useGetGames, getGetGamesQueryKey, useGetAnnouncements } from "@workspace/api-client-react";
import { Bell, Play, Star, Flame, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"all" | "hot" | "favorites" | "slots">("all");
  
  const { data: games } = useGetGames({ category: activeTab }, { 
    query: { queryKey: getGetGamesQueryKey({ category: activeTab }) } 
  });
  const { data: announcements } = useGetAnnouncements();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Announcement Marquee */}
      {announcements && announcements.length > 0 && (
        <div className="bg-secondary/80 flex items-center px-3 py-2 gap-2 border-b border-border">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="animate-[marquee_20s_linear_infinite] inline-block">
              {announcements.map((a) => (
                <span key={a.id} className="text-xs text-foreground mr-8">
                  {a.message}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aviator featured banner */}
      <div className="px-4 w-full">
        <Link href="/aviator">
          <div className="w-full rounded-2xl overflow-hidden relative border-2 border-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.3)] cursor-pointer hover:scale-[1.01] transition-transform bg-gradient-to-br from-[#0a1628] to-[#1a0a0a]">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black tracking-wider">SPRIBE</span>
                  <span className="text-[10px] text-red-400 font-bold animate-pulse">● LIVE</span>
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-wide">AVIATOR</h2>
                <p className="text-red-400 font-bold text-xs mt-0.5">Crash game · Multiplier up to 100x+</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
                  ✈ Play Now
                </div>
              </div>
              <div className="text-7xl select-none">✈</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-red-900/20 pointer-events-none" />
          </div>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="px-4 w-full">
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative border-2 border-border shadow-[0_0_20px_rgba(255,215,0,0.1)]">
          <img src="/hero.png" alt="Casino Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-2xl font-black text-white italic drop-shadow-lg">BIG WINS AWAIT</h2>
            <p className="text-primary font-bold text-sm">Join the VIP club today</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "ALL", icon: LayoutGrid },
            { id: "hot", label: "HOT", icon: Flame },
            { id: "favorites", label: "FAVS", icon: Star },
            { id: "slots", label: "SLOTS", icon: Play },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border border-border transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,215,0,0.3)] border-primary" 
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {games?.map((game) => (
            <div key={game.id} className="group relative rounded-xl overflow-hidden aspect-[3/4] border border-border bg-secondary">
              <img src={game.imageUrl || "/super-ace.png"} alt={game.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  {game.multiplier && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded border border-yellow-200 shadow-lg">
                      {game.multiplier}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">{game.provider}</div>
                  <div className="text-sm font-bold text-white leading-tight">{game.name}</div>
                </div>
              </div>
            </div>
          ))}
          {(!games || games.length === 0) && (
            <div className="col-span-2 text-center py-10 text-muted-foreground">
              No games found for this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
