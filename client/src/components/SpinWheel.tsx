/**
 * SpinWheel — Instagram-quality reward wheel for Prime Fit Community
 *
 * Features:
 * - Canvas-based animated wheel with easing + suspense deceleration
 * - Probability-weighted reward selection (server-side)
 * - Confetti celebration burst
 * - Haptic vibration (mobile)
 * - Web Audio API sound effects (no external files needed)
 * - Rarity-based glow effects
 * - Full Arabic/English support
 */
import { AppIcons } from '../components/AppIcons';
import { useRef, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Reward {
  id: number;
  name: string;
  nameAr: string;
  type: string;
  rarity: "common" | "uncommon" | "rare" | "jackpot";
  value: number | null;
  icon: string | null;
  color: string | null;
}

interface SpinResult {
  reward: {
    id: number;
    name: string;
    nameAr: string;
    type: string;
    rarity: string;
    value: number;
    icon: string;
    color: string;
  };
  spinId: number;
}

interface SpinWheelProps {
  challengeId: number;
  lang: "ar" | "en";
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const NAVY = "#1B2E5E";
const NAVY_DARK = "#0F1E3D";
const CYAN = "#7BB8D4";
const RARITY_COLORS = {
  common:   { glow: "#4A90D9", label: "Common",   labelAr: "عادي"   },
  uncommon: { glow: "#E8A020", label: "Uncommon", labelAr: "غير شائع" },
  rare:     { glow: "#C040C0", label: "Rare",     labelAr: "نادر"   },
  jackpot:  { glow: "#FF2020", label: "JACKPOT!", labelAr: "جاكبوت!" },
};

// ── Sound Engine (Web Audio API — no files needed) ────────────────────────────
function createAudioCtx() {
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
}

function playTick(ctx: AudioContext | null, freq = 800) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "square";
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.start(); osc.stop(ctx.currentTime + 0.05);
}

function playWin(ctx: AudioContext | null, rarity: string) {
  if (!ctx) return;
  const freqs = rarity === "jackpot" ? [523, 659, 784, 1047, 1319] :
                rarity === "rare"    ? [523, 659, 784, 1047] :
                rarity === "uncommon"? [523, 659, 784] : [523, 659];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = f;
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t); osc.stop(t + 0.4);
  });
}

// ── Confetti ──────────────────────────────────────────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rotSpeed: number; alpha: number; }

function createParticles(count: number, cx: number, cy: number, color: string): Particle[] {
  return Array.from({ length: count }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.8) * 14,
    color,
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10,
    alpha: 1,
  }));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SpinWheel({ challengeId, lang, onClose }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const confettiFrameRef = useRef<number>(0);
  const spinAngleRef = useRef(0);
  const lastTickSegRef = useRef(-1);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [spinToken, setSpinToken] = useState<string | null>(null);
  const [spinId, setSpinId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");

  // Fetch rewards for wheel display
  const { data: rewards = [] } = trpc.spinWheel.getRewards.useQuery();

  // Check eligibility
  const { data: eligibility } = trpc.spinWheel.checkEligibility.useQuery({ challengeId });

  // Spin mutation
  const spinMutation = trpc.spinWheel.spin.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSpinId(data.spinId);
    },
  });

  // Claim mutation
  const claimMutation = trpc.spinWheel.claimReward.useMutation();

  // Set spin token from eligibility
  useEffect(() => {
    if (eligibility?.eligible && eligibility.spin?.token) {
      setSpinToken(eligibility.spin.token);
    }
  }, [eligibility]);

  // ── Draw Wheel ──────────────────────────────────────────────────────────────
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 8;
    const segAngle = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, W, H);

    // Draw segments
    rewards.forEach((reward, i) => {
      const startAngle = angle + i * segAngle;
      const endAngle = startAngle + segAngle;
      const midAngle = startAngle + segAngle / 2;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      const baseColor = reward.color ?? "#4A90D9";
      // Alternate brightness for visual separation
      const isEven = i % 2 === 0;
      ctx.fillStyle = isEven ? baseColor : adjustBrightness(baseColor, -30);
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon + text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = "right";

      // Icon
      ctx.font = `${Math.max(12, Math.min(20, radius / rewards.length * 1.5))}px serif`;
      ctx.fillText(reward.icon ?? "🎁", radius - 10, 5);

      // Name (short)
      const label = lang === "ar" ? reward.nameAr : reward.name;
      const shortLabel = label.length > 12 ? label.slice(0, 11) + "…" : label;
      ctx.font = `bold ${Math.max(8, Math.min(11, radius / rewards.length))}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(shortLabel, radius - 32, 5);

      ctx.restore();
    });

    // Center circle
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    centerGrad.addColorStop(0, "#ffffff");
    centerGrad.addColorStop(1, CYAN);
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center logo text
    ctx.fillStyle = NAVY_DARK;
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SPIN", cx, cy + 3);

    // Pointer (top center)
    const pointerX = cx;
    const pointerY = cy - radius - 4;
    ctx.beginPath();
    ctx.moveTo(pointerX, pointerY + 20);
    ctx.lineTo(pointerX - 10, pointerY);
    ctx.lineTo(pointerX + 10, pointerY);
    ctx.closePath();
    ctx.fillStyle = "#FF4040";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tick detection for sound
    const segAngleDeg = 360 / rewards.length;
    const currentAngleDeg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    const currentSeg = Math.floor(currentAngleDeg / segAngleDeg);
    if (currentSeg !== lastTickSegRef.current) {
      lastTickSegRef.current = currentSeg;
      if (spinning) playTick(audioCtxRef.current, 600 + currentSeg * 20);
    }
  }, [rewards, lang, spinning]);

  // ── Spin Animation ──────────────────────────────────────────────────────────
  const startSpin = useCallback(async () => {
    if (!spinToken || spinning || !eligibility?.eligible) return;

    // Init audio
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioCtx();
    }

    // Haptic
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

    setSpinning(true);
    setPhase("spinning");

    // Execute server spin to get the winning reward
    let winningReward: SpinResult["reward"] | null = null;
    let winSpinId: number | null = null;
    try {
      const spinResult = await spinMutation.mutateAsync({ spinToken });
      winningReward = spinResult.reward;
      winSpinId = spinResult.spinId;
    } catch (e) {
      setSpinning(false);
      setPhase("idle");
      return;
    }

    // Find the index of the winning segment
    const winIndex = rewards.findIndex(r => r.id === winningReward!.id);
    const segAngle = (2 * Math.PI) / rewards.length;

    // Target angle: winning segment should be at the top (pointer at 270° = -π/2)
    // Pointer is at top (angle = -π/2 from center)
    // We want the middle of the winning segment to be at -π/2
    const targetSegMid = winIndex * segAngle + segAngle / 2;
    const targetFinalAngle = -Math.PI / 2 - targetSegMid;

    // Add multiple full rotations for suspense (8-12 full spins)
    const fullSpins = (8 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const startAngle = spinAngleRef.current;
    const endAngle = startAngle + fullSpins + ((targetFinalAngle - startAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const duration = 5000 + Math.random() * 2000; // 5-7 seconds
    const startTime = performance.now();

    // Easing: fast start, slow deceleration with suspense wobble near end
    function easeOutWithSuspense(t: number): number {
      if (t < 0.7) {
        // Fast phase: cubic ease-in-out
        const t2 = t / 0.7;
        return t2 * t2 * (3 - 2 * t2) * 0.85;
      } else {
        // Suspense phase: slow down with micro-oscillations
        const t2 = (t - 0.7) / 0.3;
        const base = 0.85 + t2 * 0.15;
        const wobble = Math.sin(t2 * Math.PI * 6) * 0.003 * (1 - t2);
        return base + wobble;
      }
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easeOutWithSuspense(t);
      spinAngleRef.current = startAngle + (endAngle - startAngle) * easedT;
      drawWheel(spinAngleRef.current);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        spinAngleRef.current = endAngle;
        drawWheel(spinAngleRef.current);
        setSpinning(false);
        setPhase("result");

        // Haptic win pattern
        if (navigator.vibrate) {
          const pattern = winningReward!.rarity === "jackpot" ? [100, 50, 100, 50, 200] :
                          winningReward!.rarity === "rare"    ? [100, 50, 150] : [80, 40, 80];
          navigator.vibrate(pattern);
        }

        // Win sound
        playWin(audioCtxRef.current, winningReward!.rarity);

        // Launch confetti
        launchConfetti(winningReward!.color, winningReward!.rarity);

        // Show celebration after brief delay
        setTimeout(() => setShowCelebration(true), 400);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [spinToken, spinning, eligibility, rewards, drawWheel, spinMutation]);

  // ── Confetti Animation ──────────────────────────────────────────────────────
  const launchConfetti = useCallback((color: string, rarity: string) => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = rarity === "jackpot" ? 200 : rarity === "rare" ? 120 : rarity === "uncommon" ? 80 : 50;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const colors = [color, "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    particlesRef.current = [];
    colors.forEach(c => {
      particlesRef.current.push(...createParticles(Math.floor(count / colors.length), cx, cy, c));
    });

    function animateConfetti() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.012;
        if (p.alpha > 0) {
          alive = true;
          ctx!.save();
          ctx!.globalAlpha = Math.max(0, p.alpha);
          ctx!.translate(p.x, p.y);
          ctx!.rotate((p.rotation * Math.PI) / 180);
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx!.restore();
        }
      });
      if (alive) confettiFrameRef.current = requestAnimationFrame(animateConfetti);
      else ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    confettiFrameRef.current = requestAnimationFrame(animateConfetti);
  }, []);

  // Initial draw
  useEffect(() => {
    if (rewards.length > 0) drawWheel(spinAngleRef.current);
  }, [rewards, drawWheel]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      cancelAnimationFrame(confettiFrameRef.current);
    };
  }, []);

  // ── Claim & Close ───────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (spinId) await claimMutation.mutateAsync({ spinId });
    onClose();
  };

  const rarityInfo = result ? RARITY_COLORS[result.reward.rarity as keyof typeof RARITY_COLORS] : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column",
      fontFamily: lang === "ar" ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
    }}>
      {/* Confetti layer */}
      <canvas
        ref={confettiRef}
        width={400} height={600}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {/* Main card */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        borderRadius: 24,
        padding: "24px 20px",
        width: "min(90vw, 380px)",
        position: "relative",
        boxShadow: `0 0 60px ${rarityInfo?.glow ?? CYAN}44, 0 20px 60px rgba(0,0,0,0.6)`,
        border: `1px solid ${rarityInfo?.glow ?? CYAN}44`,
        animation: "fadeInScale 0.3s ease",
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: "50%", width: 32, height: 32,
          color: "white", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><AppIcons.Close size={14} /></button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ color: "white", margin: 0, fontSize: 20, fontWeight: 900 }}>
            {lang === "ar" ? "عجلة المكافآت" : "Reward Wheel"}
          </h2>
          <p style={{ color: CYAN, fontSize: 12, margin: "4px 0 0" }}>
            {lang === "ar" ? "أكملت التحدي! دوّر العجلة للحصول على مكافأتك" : "Challenge complete! Spin to claim your reward"}
          </p>
        </div>

        {/* Wheel canvas */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <canvas
              ref={canvasRef}
              width={300} height={300}
              style={{
                borderRadius: "50%",
                filter: spinning ? `drop-shadow(0 0 16px ${CYAN})` : "none",
                transition: "filter 0.3s",
              }}
            />
            {/* Glow ring when spinning */}
            {spinning && (
              <div style={{
                position: "absolute", inset: -4,
                borderRadius: "50%",
                border: `3px solid ${CYAN}`,
                animation: "glowPulse 0.5s ease-in-out infinite alternate",
                pointerEvents: "none",
              }} />
            )}
          </div>
        </div>

        {/* Spin button */}
        {phase !== "result" && (
          <button
            onClick={startSpin}
            disabled={spinning || !eligibility?.eligible || !spinToken}
            style={{
              width: "100%",
              padding: "14px",
              background: spinning ? "rgba(123,184,212,0.3)" :
                          !eligibility?.eligible ? "rgba(255,255,255,0.1)" :
                          `linear-gradient(135deg, #FF6B35, #FF4040)`,
              border: "none",
              borderRadius: 14,
              color: "white",
              fontSize: 18,
              fontWeight: 900,
              cursor: spinning || !eligibility?.eligible ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              letterSpacing: "0.05em",
              boxShadow: spinning ? "none" : "0 4px 20px rgba(255,64,64,0.4)",
            }}
          >
            {spinning ? (lang === "ar" ? "⏳ جاري الدوران..." : "⏳ Spinning...") :
             !eligibility?.eligible ? (lang === "ar" ? "تم الاستخدام" : "Already Used") :
             (lang === "ar" ? "دوّر!" : "SPIN!")}
          </button>
        )}

        {/* Rarity legend */}
        {phase === "idle" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {(["common", "uncommon", "rare", "jackpot"] as const).map(r => (
              <span key={r} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: `${RARITY_COLORS[r].glow}22`,
                color: RARITY_COLORS[r].glow,
                border: `1px solid ${RARITY_COLORS[r].glow}44`,
                fontWeight: 700,
              }}>
                {lang === "ar" ? RARITY_COLORS[r].labelAr : RARITY_COLORS[r].label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Celebration popup */}
      {showCelebration && result && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)",
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            borderRadius: 28,
            padding: "32px 28px",
            width: "min(88vw, 360px)",
            textAlign: "center",
            boxShadow: `0 0 80px ${result.reward.color}88, 0 20px 60px rgba(0,0,0,0.8)`,
            border: `2px solid ${result.reward.color}`,
            animation: "bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            {/* Rarity badge */}
            <div style={{
              display: "inline-block",
              background: `${rarityInfo?.glow}22`,
              color: rarityInfo?.glow,
              border: `1px solid ${rarityInfo?.glow}`,
              borderRadius: 20,
              padding: "4px 16px",
              fontSize: 11,
              fontWeight: 900,
              marginBottom: 16,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              {lang === "ar" ? rarityInfo?.labelAr : rarityInfo?.label}
            </div>

            {/* Icon */}
            <div style={{
              fontSize: 72,
              marginBottom: 8,
              filter: `drop-shadow(0 0 20px ${result.reward.color})`,
              animation: "iconBounce 0.6s ease 0.3s both",
            }}>
              {result.reward.icon}
            </div>

            {/* Reward name */}
            <h2 style={{
              color: "white",
              fontSize: 22,
              fontWeight: 900,
              margin: "0 0 6px",
              textShadow: `0 0 20px ${result.reward.color}`,
            }}>
              {lang === "ar" ? result.reward.nameAr : result.reward.name}
            </h2>

            {/* Value */}
            {result.reward.value > 0 && (
              <p style={{ color: CYAN, fontSize: 14, margin: "0 0 20px", fontWeight: 700 }}>
                {result.reward.type === "xp_bonus" ? `+${result.reward.value} XP` :
                 result.reward.type === "premium_days" ? (lang === "ar" ? `${result.reward.value} يوم بريميوم` : `${result.reward.value} Premium Days`) :
                 ""}
              </p>
            )}

            {/* Claim button */}
            <button
              onClick={handleClaim}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${result.reward.color}, ${adjustBrightness(result.reward.color, 30)})`,
                border: "none",
                borderRadius: 14,
                color: "white",
                fontSize: 16,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: `0 4px 20px ${result.reward.color}66`,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              {lang === "ar" ? "استلام المكافأة!" : "Claim Reward!"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes bounceIn { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
        @keyframes iconBounce { from { transform: scale(0) rotate(-180deg); } to { transform: scale(1) rotate(0deg); } }
        @keyframes glowPulse { from { opacity: 0.4; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
      `}</style>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────
function adjustBrightness(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch { return hex; }
}
