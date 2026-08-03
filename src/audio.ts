/**
 * WoowPay Loyalty — Audio Engine v2
 * Web Audio API only. Richer tick + cinematic win fanfare.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private lastSegment = -1;
  private master: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.75;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    else if (!this.ctx) this.getCtx();
  }

  onFrame(angle: number, numSegments: number, speed: number) {
    const arc  = (2 * Math.PI) / numSegments;
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const seg  = Math.floor(norm / arc) % numSegments;
    if (seg !== this.lastSegment) {
      this.lastSegment = seg;
      this._tick(speed);
    }
  }

  /** Wood-block style tick — crisp click with a slight pitch snap */
  private _tick(speed: number) {
    try {
      const ctx = this.getCtx();
      const out = this.master!;
      const t   = ctx.currentTime;
      const vol = Math.min(0.6, Math.max(0.08, speed * 0.9));

      // Body: short bandpass noise burst (wood-block character)
      const bufLen = Math.floor(ctx.sampleRate * 0.035);
      const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800 + speed * 600;   // higher pitch when fast
      bp.Q.value = 3.5;

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(vol, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(bp); bp.connect(ng); ng.connect(out);
      noise.start(t); noise.stop(t + 0.045);

      // Transient click (gives the snap)
      const click = ctx.createOscillator();
      const cg    = ctx.createGain();
      click.type  = 'square';
      click.frequency.setValueAtTime(2200, t);
      click.frequency.exponentialRampToValueAtTime(120, t + 0.018);
      cg.gain.setValueAtTime(vol * 0.4, t);
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
      click.connect(cg); cg.connect(out);
      click.start(t); click.stop(t + 0.025);

    } catch (_) { /* ignore */ }
  }

  /** Cinematic win fanfare — build-up + chord hit + sparkle tail */
  win() {
    try {
      const ctx = this.getCtx();
      const out = this.master!;
      const t0  = ctx.currentTime;

      // ── 1. Rising sweep (excitement build-up) ────────────
      const sweep = ctx.createOscillator();
      const swG   = ctx.createGain();
      sweep.type  = 'sawtooth';
      sweep.frequency.setValueAtTime(200, t0);
      sweep.frequency.exponentialRampToValueAtTime(1600, t0 + 0.35);
      swG.gain.setValueAtTime(0.0, t0);
      swG.gain.linearRampToValueAtTime(0.12, t0 + 0.1);
      swG.gain.linearRampToValueAtTime(0.0,  t0 + 0.38);
      const swLp = ctx.createBiquadFilter();
      swLp.type = 'lowpass'; swLp.frequency.value = 3000;
      sweep.connect(swLp); swLp.connect(swG); swG.connect(out);
      sweep.start(t0); sweep.stop(t0 + 0.42);

      // ── 2. Arpeggio: C5 E5 G5 B5 C6 E6 (joyful major 7) ─
      const arpNotes = [523, 659, 784, 988, 1047, 1319];
      arpNotes.forEach((freq, i) => {
        const t = t0 + 0.28 + i * 0.085;

        // Sine layer (pure tone)
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.type = 'sine';
        o1.frequency.value = freq;
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.32, t + 0.015);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o1.connect(g1); g1.connect(out);
        o1.start(t); o1.stop(t + 0.4);

        // Triangle layer (warmth)
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.value = freq * 0.5;  // one octave down
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.14, t + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o2.connect(g2); g2.connect(out);
        o2.start(t); o2.stop(t + 0.32);
      });

      // ── 3. Big chord hit (C maj7) at peak ────────────────
      const chordT   = t0 + 0.28 + arpNotes.length * 0.085;
      const chord    = [523, 659, 784, 988];   // C E G B
      chord.forEach(freq => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type  = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0,  chordT);
        g.gain.linearRampToValueAtTime(0.18, chordT + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, chordT + 0.9);
        o.connect(g); g.connect(out);
        o.start(chordT); o.stop(chordT + 1.0);
      });

      // ── 4. Bass punch ─────────────────────────────────────
      const bass = ctx.createOscillator();
      const bG   = ctx.createGain();
      bass.type  = 'sine';
      bass.frequency.setValueAtTime(110, chordT);
      bass.frequency.exponentialRampToValueAtTime(50, chordT + 0.3);
      bG.gain.setValueAtTime(0.55, chordT);
      bG.gain.exponentialRampToValueAtTime(0.001, chordT + 0.4);
      bass.connect(bG); bG.connect(out);
      bass.start(chordT); bass.stop(chordT + 0.45);

      // ── 5. Sparkle rain (3 staggered noise bursts) ───────
      [0, 0.12, 0.26].forEach((delay, i) => {
        const st  = chordT + delay;
        const nb  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
        const nd  = nb.getChannelData(0);
        for (let j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
        const ns  = ctx.createBufferSource();
        ns.buffer = nb;
        const hp  = ctx.createBiquadFilter();
        hp.type   = 'highpass';
        hp.frequency.value = 5000 + i * 1500;
        const ng  = ctx.createGain();
        ng.gain.setValueAtTime(0.14 - i * 0.03, st);
        ng.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
        ns.connect(hp); hp.connect(ng); ng.connect(out);
        ns.start(st); ns.stop(st + 0.15);
      });

    } catch (_) { /* ignore */ }
  }

  resetSegment() { this.lastSegment = -1; }
}

export const audioEngine = new AudioEngine();
