import type { Prize } from '../types';
import { audioEngine } from '../audio';

interface SpinWheelOptions {
  prizes: Prize[];
  onResult: (prize: Prize, index: number) => void;
}

const SIZE = 380;
const POINTER_ANGLE = 3 * Math.PI / 2; // 12 o'clock (top of wheel)

/**
 * Weighted random pick over prize.weight (defaults to 1 → equal odds,
 * matching the previous uniform Math.random() * N behavior when no
 * weights are set).
 */
function pickWeightedIndex(prizes: Prize[]): number {
  const weights = prizes.map((p) => Math.max(0, p.weight ?? 1));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return Math.floor(Math.random() * prizes.length);

  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1; // floating-point safety net
}

export function SpinWheel({ prizes, onResult }: SpinWheelOptions): {
  el: HTMLCanvasElement;
  spin: () => void;
  isSpinning: () => boolean;
} {
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  canvas.className = 'spin-wheel';

  const ctx = canvas.getContext('2d')!;
  const N   = prizes.length;
  const ARC = (2 * Math.PI) / N;
  let currentAngle = 0;
  let spinning = false;

  function drawWheel(angle: number) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2, cy = SIZE / 2, R = cx - 3;

    prizes.forEach((prize, i) => {
      const start = angle + i * ARC;
      const end   = start + ARC;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Radial gradient for 3D depth
      const grad = ctx.createRadialGradient(cx, cy, R * 0.22, cx, cy, R);
      grad.addColorStop(0, 'rgba(255,255,255,.2)');
      grad.addColorStop(0.6, 'rgba(255,255,255,.04)');
      grad.addColorStop(1, 'rgba(0,0,0,.18)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment divider lines
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(start), cy + R * Math.sin(start));
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Label text ──────────────────────────────────
      const mid = start + ARC / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);

      // Emoji — closer to center
      ctx.font = '17px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.4)';
      ctx.shadowBlur  = 3;
      ctx.fillText(prize.emoji, R * 0.44, 0);

      // Short label — toward rim
      ctx.shadowBlur = 5;
      ctx.fillStyle  = '#fff';

      // Split label into two lines if needed
      const words = prize.shortLabel.split(' ');
      const maxLineW = R * 0.48;

      // Measure and split into ≤2 lines
      ctx.font = 'bold 13px Rubik, sans-serif';
      let line1 = '', line2 = '';
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxLineW && cur) {
          if (!line1) { line1 = cur; cur = w; }
          else { line2 = cur + (cur ? ' ' : '') + w; cur = ''; }
        } else { cur = test; }
      }
      if (!line1) { line1 = cur; }
      else if (cur) { line2 += (line2 ? ' ' : '') + cur; }

      const textStart = R * 0.62;
      if (line2) {
        ctx.fillText(line1, textStart + 18, -7);
        ctx.fillText(line2, textStart + 18,  7);
      } else {
        ctx.fillText(line1, textStart + 18,  0);
      }

      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center cap
    const capR  = 24;
    const capGr = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, capR);
    capGr.addColorStop(0, '#ffffff');
    capGr.addColorStop(1, '#cce9f7');
    ctx.beginPath();
    ctx.arc(cx, cy, capR, 0, 2 * Math.PI);
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = capGr;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = 'rgba(41,189,224,.95)';
    ctx.lineWidth   = 3;
    ctx.stroke();
  }

  drawWheel(0);

  function spin() {
    if (spinning) return;
    spinning = true;
    audioEngine.resume();
    audioEngine.resetSegment();

    const targetIndex  = pickWeightedIndex(prizes);
    const extra        = 8 + Math.floor(Math.random() * 5);

    // ── FIXED: aim the pointer (12 o'clock) at the target segment ──
    const currentNorm  = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const targetMid    = targetIndex * ARC + ARC / 2;                     // segment midpoint in wheel coords
    const targetNorm   = ((POINTER_ANGLE - targetMid) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let   rawSpin      = targetNorm - currentNorm;
    if (rawSpin <= 0) rawSpin += 2 * Math.PI;
    const spinAngle    = rawSpin + 2 * Math.PI * extra;

    const duration   = 4500 + Math.random() * 800;
    const startAngle = currentAngle;
    const startTime  = performance.now();

    function easeOut(t: number) { return 1 - Math.pow(1 - t, 4); }

    function frame(now: number) {
      const t     = Math.min((now - startTime) / duration, 1);
      const ease  = easeOut(t);
      const speed = t < 0.98 ? Math.max(0.02, 1 - ease) : 0;

      currentAngle = startAngle + spinAngle * ease;
      drawWheel(currentAngle);
      audioEngine.onFrame(currentAngle, N, speed);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        audioEngine.win();

        // ── FIXED landing detection — what's under the 12-o'clock pointer ──
        const norm     = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const relAngle = ((POINTER_ANGLE - norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const landed   = Math.floor(relAngle / ARC) % N;
        onResult(prizes[landed], landed);
      }
    }
    requestAnimationFrame(frame);
  }

  return { el: canvas, spin, isSpinning: () => spinning };
}
