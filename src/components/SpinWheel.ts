import type { Prize } from '../types';
import { audioEngine } from '../audio';

interface SpinWheelOptions {
  prizes: Prize[];
  onResult: (prize: Prize, index: number) => void;
}

const SIZE = 360;

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
    const cx = SIZE / 2, cy = SIZE / 2, R = cx - 2;

    prizes.forEach((prize, i) => {
      const start = angle + i * ARC;
      const end   = start + ARC;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Inner gradient for depth
      const grad = ctx.createRadialGradient(cx, cy, R * 0.28, cx, cy, R);
      grad.addColorStop(0, 'rgba(255,255,255,.16)');
      grad.addColorStop(1, 'rgba(0,0,0,.14)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment divider
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + ARC / 2);
      ctx.textAlign  = 'right';
      ctx.fillStyle  = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur  = 4;
      ctx.font = `bold 12px Inter, sans-serif`;
      ctx.fillText(prize.label, R - 14, 4);
      ctx.font = '15px serif';
      ctx.fillText(prize.emoji, R * 0.47, 5.5);
      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center cap
    const capR  = 20;
    const capGr = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, capR);
    capGr.addColorStop(0, '#ffffff');
    capGr.addColorStop(1, '#cce9f7');
    ctx.beginPath();
    ctx.arc(cx, cy, capR, 0, 2 * Math.PI);
    ctx.shadowColor = 'rgba(0,0,0,.3)';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = capGr;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = 'rgba(41,189,224,.9)';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
  }

  drawWheel(0);

  function spin() {
    if (spinning) return;
    spinning = true;
    audioEngine.resume();
    audioEngine.resetSegment();

    const targetIndex = Math.floor(Math.random() * N);
    const extra       = 8 + Math.floor(Math.random() * 5);
    const spinAngle   = 2 * Math.PI * extra
      - (targetIndex * ARC + ARC / 2)
      - (currentAngle % (2 * Math.PI));

    const duration   = 4200 + Math.random() * 800;
    const startAngle = currentAngle;
    const startTime  = performance.now();

    function easeOut(t: number) { return 1 - Math.pow(1 - t, 4); }

    function frame(now: number) {
      const t      = Math.min((now - startTime) / duration, 1);
      const ease   = easeOut(t);
      const speed  = t < 0.98 ? Math.max(0.02, 1 - ease) : 0;

      currentAngle = startAngle + spinAngle * ease;
      drawWheel(currentAngle);
      audioEngine.onFrame(currentAngle, N, speed);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        audioEngine.win();
        const norm   = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const landed = Math.floor(((2 * Math.PI - norm) / ARC + 0.5) % N);
        onResult(prizes[landed], landed);
      }
    }
    requestAnimationFrame(frame);
  }

  return { el: canvas, spin, isSpinning: () => spinning };
}
