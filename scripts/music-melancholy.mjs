/**
 * Render the collection's film soundtrack: a 28-second original ambient piece
 * (slow A-minor pads, sparse piano notes) written straight to a WAV file.
 *
 *   node scripts/music-melancholy.mjs      → assets/melancholy.wav
 *
 * Fully synthesised here, so there is nothing to license — safe for Meta ads.
 * media/manifest.json points each film's `audio` at this file; `media:build`
 * mixes it in. Swap the WAV for a licensed track any time without code changes.
 */
import { writeFile } from "node:fs/promises";

const SR = 44100, DUR = 28, N = SR * DUR;
const L = new Float64Array(N), R = new Float64Array(N);
const TAU = Math.PI * 2;

// note name → frequency
const freq = (n) => {
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0) + (+m[3] + 1) * 12;
  return 440 * 2 ** ((semi - 69) / 12);
};

/* Pads: i – VI – III – v in A minor, seven seconds a chord, long overlaps. */
const CHORDS = [
  ["A2", "E3", "A3", "C4", "E4"],   // Am
  ["F2", "C3", "F3", "A3", "E4"],   // Fmaj7
  ["C3", "G3", "C4", "E4", "G4"],   // C
  ["E2", "B2", "E3", "G3", "D4"],   // Em7
];
const padEnv = (t, len) => {
  const a = Math.min(t / 2.4, 1), r = Math.min((len - t) / 2.6, 1);
  return Math.max(0, Math.min(a, r)) ** 1.6;
};
CHORDS.forEach((notes, ci) => {
  const start = ci * 7 - (ci ? 0.9 : 0), len = 7 + (ci < 3 ? 1.8 : 0.9); // overlap into the next chord
  for (const note of notes) {
    const f = freq(note), phase = Math.random() * TAU;
    for (let i = Math.max(0, start * SR) | 0; i < Math.min(N, (start + len) * SR); i++) {
      const t = i / SR - start;
      const env = padEnv(t, len) * 0.055;
      const vib = 1 + 0.0012 * Math.sin(TAU * 0.31 * t + phase);
      const w = (d) =>
        Math.sin(TAU * f * vib * (1 + d) * t + phase) +
        0.28 * Math.sin(TAU * 2 * f * (1 + d) * t + phase * 1.7) +
        0.09 * Math.sin(TAU * 3 * f * (1 + d) * t);
      L[i] += env * w(+0.0013);
      R[i] += env * w(-0.0013);
    }
  }
  // soft root an octave down
  const f = freq(notes[0]) / 2;
  for (let i = Math.max(0, start * SR) | 0; i < Math.min(N, (start + len) * SR); i++) {
    const t = i / SR - start, s = padEnv(t, len) * 0.05 * Math.sin(TAU * f * t);
    L[i] += s; R[i] += s;
  }
});

/* Sparse piano line, felt more than heard. */
const MELODY = [[2.1, "A4"], [5.4, "B4"], [8.6, "C5"], [11.9, "A4"], [15.3, "E5"], [18.8, "D5"], [22.3, "C5"], [25.1, "B4"]];
for (const [at, note] of MELODY) {
  const f = freq(note), pan = 0.5 + 0.35 * Math.sin(at); // wander gently across the field
  for (let i = (at * SR) | 0; i < Math.min(N, (at + 5) * SR); i++) {
    const t = i / SR - at;
    const env = Math.min(t / 0.008, 1) * Math.exp(-t / 1.7) * 0.16;
    const s = env * (Math.sin(TAU * f * t) + 0.4 * Math.exp(-t / 0.5) * Math.sin(TAU * 2 * f * t) + 0.15 * Math.exp(-t / 0.25) * Math.sin(TAU * 3 * f * t));
    L[i] += s * (1 - pan); R[i] += s * pan;
  }
}

/* Master: fade the edges, normalise, write 16-bit stereo WAV. */
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(t / 1.2, 1) * Math.min((DUR - t) / 2, 1);
  L[i] *= g; R[i] *= g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.72 / peak;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4);
  data.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVEfmt ", 8);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
h.write("data", 36); h.writeUInt32LE(data.length, 40);
await writeFile(new URL("../assets/melancholy.wav", import.meta.url), Buffer.concat([h, data]));
console.log(`assets/melancholy.wav — ${DUR}s, peak ${(gain * peak).toFixed(2)}`);
