// All sound is synthesised with WebAudio: no audio files, no network.
// Short blips for actions, a sizzle tick while food cooks, a little arpeggio
// for a served dish. M toggles mute; the game starts silent until the first
// user gesture, as browsers require.

let ctx = null;
let muted = false;
let sizzleTimer = 0;

function audio() {
  if (ctx === null) {
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx !== null && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audio();
  if (ac === null) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.1, freq = 1800) {
  if (muted) return;
  const ac = audio();
  if (ac === null) return;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  unlock() { audio(); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  pickup() { tone(520, 0.07, 'triangle', 0.1); },
  putdown() { tone(340, 0.07, 'triangle', 0.09); },
  chop() { noiseBurst(0.06, 0.16, 900); tone(180, 0.05, 'square', 0.05); },
  chopDone() { tone(660, 0.09, 'triangle', 0.11); tone(880, 0.12, 'triangle', 0.1, 0.08); },
  cookDone() { tone(740, 0.1, 'sine', 0.12); tone(988, 0.14, 'sine', 0.11, 0.09); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.08, 0, 110); },
  serve() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.11, i * 0.07)); },
  error() { tone(160, 0.16, 'square', 0.07, 0, 120); },
  orderIn() { tone(880, 0.08, 'sine', 0.08); tone(1175, 0.1, 'sine', 0.07, 0.07); },
  expired() { tone(330, 0.2, 'sawtooth', 0.07, 0, 220); tone(220, 0.3, 'sawtooth', 0.07, 0.18, 147); },
  click() { tone(700, 0.05, 'triangle', 0.07); },
  dayClear() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.11, i * 0.09)); },
  gameOver() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.14)); },
  /** A soft sizzle tick, called while any burner is cooking. */
  sizzle(dt) {
    sizzleTimer -= dt;
    if (sizzleTimer <= 0) {
      sizzleTimer = 0.22 + Math.random() * 0.15;
      noiseBurst(0.12, 0.045, 3200 + Math.random() * 1500);
    }
  },
};
