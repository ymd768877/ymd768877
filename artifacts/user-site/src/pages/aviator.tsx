import { useEffect, useRef, useState, useCallback } from "react";
import { useGetMe, usePlaceBet, useClaimWin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "waiting" | "flying" | "crashed";

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.01, parseFloat((1 / (1 - r * 0.97)).toFixed(2)));
}

function multColor(m: number) {
  if (m < 2) return "text-blue-400";
  if (m < 10) return "text-yellow-400";
  return "text-green-400";
}

const QUICK_BETS = [10, 50, 100, 500];

export default function Aviator() {
  const { data: user, refetch: refetchUser } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();
  const placeBet = usePlaceBet();
  const claimWin = useClaimWin();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(2);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const phaseRef = useRef<Phase>("waiting");
  const multiplierRef = useRef<number>(1.0);
  const betAmountRef = useRef<number>(0);
  const hasBetRef = useRef<boolean>(false);
  const cashedOutRef = useRef<boolean>(false);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(5);
  const [betInput, setBetInput] = useState("10");
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMult, setCashoutMult] = useState(0);
  const [history, setHistory] = useState<number[]>([3.42, 1.23, 8.91, 1.5, 24.1, 1.0, 5.67, 2.11]);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (user) setBalance(user.balance);
  }, [user]);

  const drawCanvas = useCallback((crashed = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0a1628");
    bgGrad.addColorStop(1, "#0f1e35");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (H / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = (W / 6) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    // Glow under curve
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, H * 0.1, 0, H);
    fillGrad.addColorStop(0, crashed ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.18)");
    fillGrad.addColorStop(1, "rgba(239,68,68,0.0)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Curve line
    const lineGrad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    lineGrad.addColorStop(0, crashed ? "#ef4444" : "#f97316");
    lineGrad.addColorStop(1, crashed ? "#ef4444" : "#ef4444");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!crashed) {
      // Plane at tip
      const last = pts[pts.length - 1];
      const prev = pts[Math.max(0, pts.length - 3)];
      const angle = Math.atan2(prev.y - last.y, last.x - prev.x);
      ctx.save();
      ctx.translate(last.x, last.y);
      ctx.rotate(-angle);
      ctx.font = "28px serif";
      ctx.fillText("✈", -8, 8);
      ctx.restore();
    }
  }, []);

  const startWaiting = useCallback(() => {
    phaseRef.current = "waiting";
    setPhase("waiting");
    setMultiplier(1.0);
    multiplierRef.current = 1.0;
    setHasBet(false);
    setCashedOut(false);
    hasBetRef.current = false;
    cashedOutRef.current = false;
    betAmountRef.current = 0;
    pointsRef.current = [];
    crashPointRef.current = generateCrashPoint();

    // Draw empty canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const W = canvas.width; const H = canvas.height;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#0a1628"); bg.addColorStop(1, "#0f1e35");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      }
    }

    let secs = 5;
    setCountdown(secs);
    const tick = () => {
      secs--;
      setCountdown(secs);
      if (secs > 0) {
        waitTimerRef.current = setTimeout(tick, 1000);
      } else {
        startFlying();
      }
    };
    waitTimerRef.current = setTimeout(tick, 1000);
  }, []);

  const startFlying = useCallback(() => {
    phaseRef.current = "flying";
    setPhase("flying");
    startTimeRef.current = performance.now();
    pointsRef.current = [];

    const loop = (ts: number) => {
      if (phaseRef.current !== "flying") return;
      const elapsed = (ts - startTimeRef.current) / 1000;
      const newMult = parseFloat(Math.exp(0.07 * elapsed).toFixed(2));
      multiplierRef.current = newMult;
      setMultiplier(newMult);

      const canvas = canvasRef.current;
      if (canvas) {
        const W = canvas.width;
        const H = canvas.height;
        const maxMult = 15;
        const displayMult = Math.min(newMult, maxMult);
        const xProgress = Math.min(elapsed / 25, 0.92);
        const x = W * 0.06 + xProgress * W * 0.88;
        const yLog = Math.log(Math.max(1, displayMult)) / Math.log(maxMult);
        const y = H * 0.88 - yLog * H * 0.78;
        pointsRef.current.push({ x, y: Math.max(H * 0.06, y) });
        drawCanvas(false);
      }

      if (newMult >= crashPointRef.current) {
        doCrash(newMult);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [drawCanvas]);

  const doCrash = useCallback((finalMult: number) => {
    cancelAnimationFrame(rafRef.current);
    phaseRef.current = "crashed";
    setPhase("crashed");
    setMultiplier(finalMult);

    // If had bet and didn't cash out
    if (hasBetRef.current && !cashedOutRef.current) {
      toast({ title: `Flew away at ${finalMult.toFixed(2)}x`, description: `You lost Tk ${betAmountRef.current.toFixed(0)}`, variant: "destructive" });
    }

    drawCanvas(true);
    setHistory(prev => [finalMult, ...prev].slice(0, 12));

    waitTimerRef.current = setTimeout(() => {
      startWaiting();
    }, 3000);
  }, [drawCanvas, toast, startWaiting]);

  const handleBet = useCallback(() => {
    if (phase !== "waiting" && phase !== "flying") return;
    if (hasBet) return;
    const amt = parseFloat(betInput);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid bet amount", variant: "destructive" }); return; }
    if (amt > balance) { toast({ title: "Insufficient balance", variant: "destructive" }); return; }

    placeBet.mutate({ data: { amount: amt } }, {
      onSuccess: () => {
        betAmountRef.current = amt;
        hasBetRef.current = true;
        setHasBet(true);
        setBalance(prev => prev - amt);
        toast({ title: `Bet placed: Tk ${amt.toFixed(0)}` });
      },
      onError: (e: any) => {
        toast({ title: "Bet failed", description: e?.response?.data?.error, variant: "destructive" });
      },
    });
  }, [phase, hasBet, betInput, balance, placeBet, toast]);

  const handleCashout = useCallback(() => {
    if (phase !== "flying" || !hasBet || cashedOut) return;
    const mult = multiplierRef.current;
    const winnings = betAmountRef.current * mult;

    claimWin.mutate({ data: { amount: winnings } }, {
      onSuccess: () => {
        cashedOutRef.current = true;
        setCashedOut(true);
        setCashoutMult(mult);
        setBalance(prev => prev + winnings);
        toast({ title: `Cashed out at ${mult.toFixed(2)}x!`, description: `+Tk ${winnings.toFixed(0)}` });
        refetchUser();
      },
      onError: (e: any) => {
        toast({ title: "Cashout failed", description: e?.response?.data?.error, variant: "destructive" });
      },
    });
  }, [phase, hasBet, cashedOut, claimWin, toast, refetchUser]);

  useEffect(() => {
    startWaiting();
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Set canvas size based on container
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, []);

  const crashedBet = phase === "crashed" && hasBet && !cashedOut;
  const cashedOutWin = cashedOut && phase === "flying";

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col bg-[#0a1628]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f1e35] border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <img src="https://spribe.co/favicon.ico" className="w-4 h-4 rounded" onError={(e) => { (e.target as any).style.display = 'none'; }} />
          <span className="text-white font-black text-lg tracking-wide">AVIATOR</span>
          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">SPRIBE</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/40">Balance</div>
          <div className="text-sm font-bold text-yellow-400">Tk {balance.toFixed(0)}</div>
        </div>
      </div>

      {/* History bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] overflow-x-auto scrollbar-none border-b border-white/5">
        {history.map((m, i) => (
          <span key={i} className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-white/5", multColor(m))}>
            {m.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Game canvas */}
      <div className="relative flex-1 min-h-[240px]">
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />

        {/* Multiplier overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {phase === "waiting" && (
            <div className="text-center">
              <div className="text-white/60 text-sm font-medium mb-1">Next round in</div>
              <div className="text-5xl font-black text-white">{countdown}s</div>
              <div className="text-white/40 text-xs mt-1">Place your bets!</div>
            </div>
          )}
          {phase === "flying" && !cashedOut && (
            <div className="text-center">
              <div className="text-6xl font-black text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}
          {phase === "flying" && cashedOut && (
            <div className="text-center">
              <div className="text-green-400 font-bold text-sm mb-1">Cashed out!</div>
              <div className="text-5xl font-black text-green-400">
                {cashoutMult.toFixed(2)}x
              </div>
            </div>
          )}
          {phase === "crashed" && (
            <div className="text-center">
              <div className="text-red-400 font-bold text-sm mb-1 animate-pulse">FLEW AWAY!</div>
              <div className="text-5xl font-black text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bet panel */}
      <div className="bg-[#0f1e35] border-t border-white/5 p-4 space-y-3">
        {/* Quick bet amounts */}
        <div className="flex gap-2">
          {QUICK_BETS.map(amt => (
            <button
              key={amt}
              onClick={() => setBetInput(String(amt))}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all",
                betInput === String(amt)
                  ? "bg-red-500/20 border-red-500 text-red-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
              )}
            >
              {amt}
            </button>
          ))}
        </div>

        {/* Bet input + action button */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center bg-[#0a1628] border border-white/10 rounded-xl flex-1 px-3">
            <button
              className="text-white/40 text-lg hover:text-white pr-2"
              onClick={() => setBetInput(prev => String(Math.max(1, parseFloat(prev || "0") - 10)))}
            >−</button>
            <input
              type="number"
              value={betInput}
              onChange={e => setBetInput(e.target.value)}
              className="bg-transparent text-white text-center font-bold flex-1 py-2 outline-none w-0 min-w-0"
              min="1"
            />
            <button
              className="text-white/40 text-lg hover:text-white pl-2"
              onClick={() => setBetInput(prev => String(parseFloat(prev || "0") + 10))}
            >+</button>
          </div>

          {/* Action button */}
          {!hasBet ? (
            <button
              onClick={handleBet}
              disabled={placeBet.isPending || (phase === "crashed")}
              className={cn(
                "flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-lg",
                phase === "crashed"
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-white active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              )}
            >
              {placeBet.isPending ? "..." : `BET\nTk ${betInput}`}
            </button>
          ) : !cashedOut ? (
            <button
              onClick={handleCashout}
              disabled={phase !== "flying" || claimWin.isPending}
              className={cn(
                "flex-1 py-3.5 rounded-xl font-black text-sm transition-all",
                phase === "flying"
                  ? "bg-yellow-500 hover:bg-yellow-400 text-black active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              {claimWin.isPending ? "..." : phase === "flying" ? `CASH OUT\nTk ${(parseFloat(betInput) * multiplier).toFixed(0)}` : "Waiting..."}
            </button>
          ) : (
            <div className="flex-1 py-3.5 rounded-xl font-black text-sm bg-green-500/20 border border-green-500 text-green-400 text-center">
              ✓ Cashed out!
            </div>
          )}
        </div>

        {/* Status message */}
        {crashedBet && (
          <div className="text-center text-red-400 text-sm font-bold animate-pulse">
            Lost Tk {betAmountRef.current.toFixed(0)} — better luck next round!
          </div>
        )}
      </div>
    </div>
  );
}
