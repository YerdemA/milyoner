// All sound effects are synthesized with the Web Audio API: no audio files, no licensing,
// nothing to preload. See public/sounds/CREDITS.md.
//
// Browsers only allow audio after a user gesture, so the AudioContext is created lazily on
// the first click/key press (see unlockAudio).

const MUTE_KEY = "bilgi-yarismasi.muted";
const MASTER_VOLUME = 0.7;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = readMuted();
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    // A compressor keeps stacked sounds from clipping on loud classroom speakers.
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOLUME;
    master.connect(compressor);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { ctx, out: master! };
}

/** Call from a click/keydown handler so later sounds are allowed to play. */
export function unlockAudio() {
  audio();
}

// ----- mute state (also used by the UI through useSyncExternalStore) -----

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // Not critical.
  }
  if (ctx && master) master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05);
  listeners.forEach((l) => l());
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ----- building blocks -----

type ToneOptions = {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  start?: number; // seconds from now
  duration: number;
  gain?: number;
  attack?: number;
  filter?: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number };
  detune?: number;
};

function tone(o: ToneOptions) {
  const a = audio();
  if (!a || muted) return;
  const { ctx, out } = a;
  const t0 = ctx.currentTime + (o.start ?? 0);
  const t1 = t0 + o.duration;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t1);
  if (o.detune) osc.detune.value = o.detune;

  const env = ctx.createGain();
  const peak = o.gain ?? 0.3;
  const attack = o.attack ?? 0.01;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t1);

  let node: AudioNode = osc;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = o.filter.type;
    f.frequency.setValueAtTime(o.filter.freq, t0);
    if (o.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(o.filter.freqEnd, t1);
    f.Q.value = o.filter.q ?? 1;
    osc.connect(f);
    node = f;
  }
  node.connect(env).connect(out);
  osc.start(t0);
  osc.stop(t1 + 0.05);
}

function noise(o: { start?: number; duration: number; gain?: number; filter: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number } }) {
  const a = audio();
  if (!a || muted) return;
  const { ctx, out } = a;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + (o.start ?? 0);
  const t1 = t0 + o.duration;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = o.filter.type;
  f.frequency.setValueAtTime(o.filter.freq, t0);
  if (o.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(o.filter.freqEnd, t1);
  f.Q.value = o.filter.q ?? 1;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t0 + o.duration * 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, t1);
  src.connect(f).connect(env).connect(out);
  src.start(t0);
  src.stop(t1 + 0.05);
}

// Note frequencies (Hz)
const N = { D3: 146.83, E3: 164.81, G3: 196.0, A3: 220.0, C4: 261.63, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5, E6: 1318.5, G6: 1567.98 };

// ----- sound effects -----

export const sounds = {
  /** New question appears: airy rising whoosh + soft chime. */
  question() {
    noise({ duration: 0.6, gain: 0.12, filter: { type: "bandpass", freq: 300, freqEnd: 3500, q: 2 } });
    tone({ freq: N.A5, start: 0.35, duration: 0.6, gain: 0.08, type: "sine" });
    tone({ freq: N.E6, start: 0.38, duration: 0.5, gain: 0.04, type: "sine" });
  },

  /** Answer locked in: deep thump with a click on top. */
  lock() {
    tone({ freq: 160, freqEnd: 50, duration: 0.35, gain: 0.7, type: "sine" });
    tone({ freq: 1200, duration: 0.04, gain: 0.08, type: "square", filter: { type: "lowpass", freq: 3000 } });
  },

  /**
   * Suspense drone for the moment before the reveal. Returns a stop function.
   * Two detuned saws under a slowly opening filter, with a tremolo that speeds up.
   */
  suspense(durationSec: number): () => void {
    const a = audio();
    if (!a || muted) return () => {};
    const { ctx, out } = a;
    const t0 = ctx.currentTime;
    const t1 = t0 + durationSec;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, t0);
    filter.frequency.exponentialRampToValueAtTime(1400, t1);
    filter.Q.value = 6;

    const tremolo = ctx.createGain();
    tremolo.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(4, t0);
    lfo.frequency.linearRampToValueAtTime(12, t1);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth).connect(tremolo.gain);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.22, t0 + 0.4);
    env.gain.linearRampToValueAtTime(0.32, t1);

    const oscs = [55, 55.6, 110.3].map((freq) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(freq, t0);
      o.frequency.linearRampToValueAtTime(freq * 1.06, t1); // pitch creeps up
      o.connect(filter);
      o.start(t0);
      return o;
    });
    filter.connect(tremolo).connect(env).connect(out);
    lfo.start(t0);

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(Math.max(env.gain.value, 0.0001), now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      [...oscs, lfo].forEach((o) => o.stop(now + 0.15));
    };
  },

  /** Correct: bright rising arpeggio landing on a chord, plus sparkle. */
  correct() {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) =>
      tone({ freq: f, start: i * 0.08, duration: 0.45, gain: 0.22, type: "triangle" }),
    );
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f) =>
      tone({ freq: f, start: 0.34, duration: 1.4, gain: 0.09, type: "sine", attack: 0.02 }),
    );
    noise({ start: 0.3, duration: 0.9, gain: 0.06, filter: { type: "highpass", freq: 6000 } });
  },

  /** Wrong: two low falling notes. */
  wrong() {
    const filter = { type: "lowpass" as const, freq: 900, q: 2 };
    tone({ freq: N.G3, duration: 0.32, gain: 0.3, type: "sawtooth", filter });
    tone({ freq: N.D3, freqEnd: N.D3 * 0.94, start: 0.34, duration: 0.9, gain: 0.32, type: "sawtooth", filter });
    tone({ freq: N.D3 / 2, start: 0.34, duration: 0.9, gain: 0.25, type: "sine" });
  },

  /** First wrong guess with the double answer joker: short "no", then a hopeful rise. */
  secondChance() {
    tone({ freq: N.A3, duration: 0.25, gain: 0.25, type: "sawtooth", filter: { type: "lowpass", freq: 900 } });
    tone({ freq: N.A4, freqEnd: N.E5, start: 0.3, duration: 0.35, gain: 0.15, type: "triangle" });
  },

  /** Time is up: three descending beeps. */
  timeout() {
    [N.A5, N.E5, N.A4].forEach((f, i) =>
      tone({ freq: f, start: i * 0.18, duration: 0.16, gain: 0.18, type: "square", filter: { type: "lowpass", freq: 2500 } }),
    );
    tone({ freq: N.A3, start: 0.54, duration: 0.8, gain: 0.2, type: "sawtooth", filter: { type: "lowpass", freq: 700 } });
  },

  /** Countdown tick in the last seconds; the final second is higher. */
  tick(remainingSec: number) {
    tone({ freq: remainingSec <= 1 ? 1600 : 1100, duration: 0.07, gain: 0.25, type: "triangle" });
  },

  /** Joker used: quick magical sparkle. */
  joker() {
    [N.C6, N.E6, N.G6, N.C6 * 2].forEach((f, i) =>
      tone({ freq: f, start: i * 0.05, duration: 0.3, gain: 0.08, type: "sine" }),
    );
    noise({ duration: 0.5, gain: 0.05, filter: { type: "highpass", freq: 5000 } });
  },

  /** End of quiz: fanfare; a calmer version for lower scores. */
  finish(scoreRatio: number) {
    const brass = { type: "lowpass" as const, freq: 2600, q: 1 };
    const chords = scoreRatio >= 0.5
      ? [[N.C4, N.E4, N.G4], [N.F4, N.A4, N.C5], [N.G4, N.C5, N.E5], [N.C5, N.E5, N.G5, N.C6]]
      : [[N.C4, N.E4, N.G4], [N.F4, N.A4, N.C5], [N.C4, N.E4, N.G4]];
    chords.forEach((chord, i) => {
      const last = i === chords.length - 1;
      chord.forEach((f) =>
        tone({ freq: f, start: i * 0.22, duration: last ? 1.6 : 0.24, gain: 0.1, type: "sawtooth", filter: brass, attack: 0.02 }),
      );
    });
    if (scoreRatio >= 0.5) noise({ start: 0.66, duration: 1.4, gain: 0.07, filter: { type: "highpass", freq: 5500 } });
  },
};
