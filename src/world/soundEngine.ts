import type { FootstepSurfaceKind, SpatialAmbienceMix } from './worldLogic';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private lastStepTime = 0;

  // Continuous Himalayan wind, foliage rustle, stream murmur, bird bus & ambient nature pad graph
  private windStarted = false;
  private windNoiseSrc: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windHowlGain: GainNode | null = null;
  private windFilterLow: BiquadFilterNode | null = null;
  private windFilterHowl: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private rustleFilter1: BiquadFilterNode | null = null;
  private rustleFilter2: BiquadFilterNode | null = null;
  private rustleGain: GainNode | null = null;
  private rustleLfo: OscillatorNode | null = null;
  private streamGain: GainNode | null = null;
  private birdBusGain: GainNode | null = null;
  private ambientPadGain: GainNode | null = null;
  private ambientPadOsc1: OscillatorNode | null = null;
  private ambientPadOsc2: OscillatorNode | null = null;
  private ambientPadLfo: OscillatorNode | null = null;

  // Ambient birdsong scheduling
  private nextBirdAtSec = 0;
  private currentZone: SpatialAmbienceMix['activeZone'] = 'open-valley';

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (next) {
      const ctx = this.ensureContext();
      if (ctx) {
        this.ensureWindGraph(ctx);
        this.nextBirdAtSec = ctx.currentTime + 0.35;
      }
      this.playTone(528, 0.14, 'sine', 0.07);
    } else if (this.ctx) {
      const t = this.ctx.currentTime;
      for (const gNode of [
        this.windGain,
        this.windHowlGain,
        this.rustleGain,
        this.streamGain,
        this.birdBusGain,
        this.ambientPadGain,
      ]) {
        if (gNode) {
          gNode.gain.cancelScheduledValues(t);
          gNode.gain.setTargetAtTime(0.0, t, 0.15);
        }
      }
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const len = Math.floor(sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.153852;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    // Crossfade buffer loop edges for seamless playback
    const fadeSamples = Math.min(2048, Math.floor(len * 0.05));
    for (let i = 0; i < fadeSamples; i++) {
      const w = i / fadeSamples;
      data[i] = data[i] * w + data[len - fadeSamples + i] * (1 - w);
    }
    return buf;
  }

  private ensureWindGraph(ctx: AudioContext): void {
    if (this.windStarted) return;
    this.windStarted = true;

    const src = ctx.createBufferSource();
    src.buffer = this.createPinkNoiseBuffer(ctx, 3.2);
    src.loop = true;

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 420;
    lowFilter.Q.value = 0.7;

    const howlFilter = ctx.createBiquadFilter();
    howlFilter.type = 'bandpass';
    howlFilter.frequency.value = 310;
    howlFilter.Q.value = 2.6;

    const windGain = ctx.createGain();
    windGain.gain.value = 0;

    const howlGain = ctx.createGain();
    howlGain.gain.value = 0;

    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.value = 920;
    streamFilter.Q.value = 1.15;

    const streamGain = ctx.createGain();
    streamGain.gain.value = 0;

    // Dual-band procedural wind-rustling foliage leaves chain modulated by swaying gust LFO
    const rustleFilter1 = ctx.createBiquadFilter();
    rustleFilter1.type = 'bandpass';
    rustleFilter1.frequency.value = 1650;
    rustleFilter1.Q.value = 1.65;

    const rustleFilter2 = ctx.createBiquadFilter();
    rustleFilter2.type = 'bandpass';
    rustleFilter2.frequency.value = 3050;
    rustleFilter2.Q.value = 2.05;

    const rustleSwellGain = ctx.createGain();
    rustleSwellGain.gain.value = 0.72;

    const rustleGain = ctx.createGain();
    rustleGain.gain.value = 0;

    const rustleLfo = ctx.createOscillator();
    rustleLfo.type = 'sine';
    rustleLfo.frequency.value = 0.29;

    const rustleFreqDepth = ctx.createGain();
    rustleFreqDepth.gain.value = 380;
    rustleLfo.connect(rustleFreqDepth);
    rustleFreqDepth.connect(rustleFilter1.frequency);
    rustleFreqDepth.connect(rustleFilter2.frequency);

    const rustleAmpDepth = ctx.createGain();
    rustleAmpDepth.gain.value = 0.26;
    rustleLfo.connect(rustleAmpDepth);
    rustleAmpDepth.connect(rustleSwellGain.gain);

    // Master birdsong bus so volume adapts smoothly in real time with forest proximity
    const birdBusGain = ctx.createGain();
    birdBusGain.gain.value = 0.5;
    birdBusGain.connect(ctx.destination);

    // Gentle breeze swell LFO modulating filter cutoff
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.14;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth);
    lfoDepth.connect(lowFilter.frequency);
    lfoDepth.connect(howlFilter.frequency);

    src.connect(lowFilter);
    lowFilter.connect(windGain);
    windGain.connect(ctx.destination);

    src.connect(howlFilter);
    howlFilter.connect(howlGain);
    howlGain.connect(ctx.destination);

    src.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(ctx.destination);

    src.connect(rustleFilter1);
    src.connect(rustleFilter2);
    rustleFilter1.connect(rustleSwellGain);
    rustleFilter2.connect(rustleSwellGain);
    rustleSwellGain.connect(rustleGain);
    rustleGain.connect(ctx.destination);

    // Subtle open-fifth ambient nature harmonic pad (132Hz + 198Hz)
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 320;
    const padGain = ctx.createGain();
    padGain.gain.value = 0;

    const padOsc1 = ctx.createOscillator();
    padOsc1.type = 'sine';
    padOsc1.frequency.value = 132;
    const padOsc2 = ctx.createOscillator();
    padOsc2.type = 'sine';
    padOsc2.frequency.value = 198;
    const padLfo = ctx.createOscillator();
    padLfo.type = 'sine';
    padLfo.frequency.value = 0.09;
    const padLfoDepth = ctx.createGain();
    padLfoDepth.gain.value = 0.004;
    padLfo.connect(padLfoDepth);
    padLfoDepth.connect(padGain.gain);

    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(ctx.destination);

    src.start();
    lfo.start();
    rustleLfo.start();
    padOsc1.start();
    padOsc2.start();
    padLfo.start();

    this.windNoiseSrc = src;
    this.windFilterLow = lowFilter;
    this.windFilterHowl = howlFilter;
    this.windGain = windGain;
    this.windHowlGain = howlGain;
    this.windLfo = lfo;
    this.rustleFilter1 = rustleFilter1;
    this.rustleFilter2 = rustleFilter2;
    this.rustleGain = rustleGain;
    this.rustleLfo = rustleLfo;
    this.streamGain = streamGain;
    this.birdBusGain = birdBusGain;
    this.ambientPadGain = padGain;
    this.ambientPadOsc1 = padOsc1;
    this.ambientPadOsc2 = padOsc2;
    this.ambientPadLfo = padLfo;
  }

  /**
   * Continuously updates spatial Himalayan wind, wind-rustling foliage, mountain stream,
   * nature harmonic pad & forest-proximity birdsong.
   */
  public updateAmbience(mix: SpatialAmbienceMix, _dt: number): void {
    this.currentZone = mix.activeZone;
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.ensureWindGraph(ctx);
    const t = ctx.currentTime;
    const forestLevel = Math.max(0, Math.min(1, mix.forestLevel ?? 0));
    const rustleLevel = Math.max(0, Math.min(1, mix.rustleLevel ?? forestLevel * mix.windLevel));

    if (this.windGain && this.windHowlGain && this.windFilterLow && this.windFilterHowl) {
      const baseVol = Math.pow(mix.windLevel, 1.25) * 0.068;
      const howlVol = Math.max(0, mix.windLevel - 0.35) * 0.032;
      this.windGain.gain.setTargetAtTime(baseVol, t, 0.45);
      this.windHowlGain.gain.setTargetAtTime(howlVol, t, 0.55);
      this.windFilterLow.frequency.setTargetAtTime(280 + mix.windLevel * 440, t, 0.5);
      this.windFilterHowl.frequency.setTargetAtTime(220 + mix.windLevel * 290, t, 0.6);
    }

    if (this.rustleGain && this.rustleFilter1 && this.rustleFilter2) {
      const rustleVol = Math.pow(rustleLevel, 1.15) * 0.056;
      this.rustleGain.gain.setTargetAtTime(rustleVol, t, 0.35);
      this.rustleFilter1.frequency.setTargetAtTime(1400 + rustleLevel * 620, t, 0.45);
      this.rustleFilter2.frequency.setTargetAtTime(2650 + rustleLevel * 850, t, 0.45);
    }

    if (this.streamGain) {
      const streamVol = Math.pow(Math.max(0, mix.streamLevel ?? 0), 1.15) * 0.048;
      this.streamGain.gain.setTargetAtTime(streamVol, t, 0.45);
    }

    if (this.birdBusGain) {
      const birdBusVol = Math.max(0.18, Math.min(1.25, 0.25 + mix.birdLevel * 0.65 + forestLevel * 0.35));
      this.birdBusGain.gain.setTargetAtTime(birdBusVol, t, 0.32);
    }

    if (this.ambientPadGain) {
      const padVol = mix.activeZone === 'temple-courtyard' ? 0.019 : 0.015;
      this.ambientPadGain.gain.setTargetAtTime(padVol, t, 0.8);
    }

    const effectiveBirdActivity = Math.max(mix.birdLevel, forestLevel * 0.85);
    if (effectiveBirdActivity > 0.16 && t >= this.nextBirdAtSec) {
      if (mix.activeZone === 'temple-courtyard' && Math.random() < 0.55) {
        this.triggerDoveCoo(ctx, mix.birdLevel);
      } else {
        this.triggerSongbirdChirp(ctx, mix.birdLevel, forestLevel);
      }
      const interval = Math.max(0.85, 3.4 - effectiveBirdActivity * 2.25 + Math.random() * 1.9);
      this.nextBirdAtSec = t + interval;
    }
  }

  private triggerSongbirdChirp(ctx: AudioContext, level: number, forestLevel = 0): void {
    const t = ctx.currentTime;
    const bus: AudioNode = this.birdBusGain ?? ctx.destination;
    const pan = (Math.random() - 0.5) * 1.35;
    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      panner.connect(bus);
    }
    const out: AudioNode = panner ?? bus;

    const notes = 2 + Math.floor(Math.random() * (forestLevel > 0.45 ? 4 : 3));
    const baseFreq = 2050 + Math.random() * 1250;
    const vol = (0.013 + level * 0.021 + forestLevel * 0.014) * (0.72 + Math.random() * 0.42);

    for (let i = 0; i < notes; i++) {
      const start = t + i * (0.085 + Math.random() * 0.05);
      const dur = 0.055 + Math.random() * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f0 = baseFreq * (1 + (Math.random() - 0.5) * 0.24);
      const f1 = f0 * (1.22 + Math.random() * 0.26);
      osc.frequency.setValueAtTime(f0, start);
      osc.frequency.exponentialRampToValueAtTime(f1, start + dur * 0.55);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.94, start + dur);

      gain.gain.setValueAtTime(0.0005, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + dur);

      osc.connect(gain);
      gain.connect(out);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
  }

  private triggerDoveCoo(ctx: AudioContext, level: number): void {
    const t = ctx.currentTime;
    const bus: AudioNode = this.birdBusGain ?? ctx.destination;
    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = (Math.random() - 0.5) * 1.1;
      panner.connect(bus);
    }
    const out: AudioNode = panner ?? bus;

    const syllables = [
      { offset: 0, dur: 0.22, fStart: 375, fEnd: 330 },
      { offset: 0.28, dur: 0.16, fStart: 390, fEnd: 425 },
      { offset: 0.48, dur: 0.34, fStart: 405, fEnd: 315 },
    ];
    const vol = 0.018 + level * 0.018;
    for (const s of syllables) {
      const start = t + s.offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(s.fStart, start);
      osc.frequency.exponentialRampToValueAtTime(s.fEnd, start + s.dur);
      gain.gain.setValueAtTime(0.0005, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + s.dur);
      osc.connect(gain);
      gain.connect(out);
      osc.start(start);
      osc.stop(start + s.dur + 0.02);
    }
  }

  public playFootstep(surface: FootstepSurfaceKind = 'stone'): void {
    const now = performance.now();
    if (now - this.lastStepTime < 250) return;
    this.lastStepTime = now;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    if (surface === 'grass') {
      // Soft grass swish + muted earth thud
      const buf = this.createPinkNoiseBuffer(ctx, 0.09);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1150 + Math.random() * 350, t);
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.028, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      src.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.085);
      this.playTone(88 + Math.random() * 14, 0.045, 'sine', 0.024);
    } else if (surface === 'wood') {
      const pitch = 108 + (Math.random() - 0.5) * 16;
      this.playTone(pitch, 0.07, 'triangle', 0.046);
      this.playTone(pitch * 1.92, 0.04, 'sine', 0.018);
    } else {
      const pitch = 148 + (Math.random() - 0.5) * 24;
      this.playTone(pitch, 0.048, 'triangle', 0.036);
      this.playTone(860 + Math.random() * 180, 0.02, 'sine', 0.01);
    }
  }

  public playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.16);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Realistic cast-bronze Nepali Ghanta temple bell synthesis:
   * metallic clapper strike transient + inharmonic bell overtones + warm long resonance.
   */
  public playTempleBell(gainScale = 1, pitchScale = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const volScale = Math.max(0.15, Math.min(1.2, gainScale));
    const f0 = 330 * pitchScale;

    // Warm bronze lowpass to mellow sharp upper overtones
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(4200, t);
    masterFilter.frequency.exponentialRampToValueAtTime(1400, t + 2.4);
    masterFilter.connect(ctx.destination);

    // 1. Clapper strike metallic transient (short bright burst)
    const strikeOsc = ctx.createOscillator();
    const strikeGain = ctx.createGain();
    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(f0 * 6.85, t);
    strikeOsc.frequency.exponentialRampToValueAtTime(f0 * 4.9, t + 0.045);
    strikeGain.gain.setValueAtTime(0.075 * volScale, t);
    strikeGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
    strikeOsc.connect(strikeGain);
    strikeGain.connect(masterFilter);
    strikeOsc.start(t);
    strikeOsc.stop(t + 0.07);

    // 2. Classic cast-bronze bell partial series (hum, prime, tierce, quint, nominal, superquint)
    const partials: Array<{ ratio: number; amp: number; decay: number; detune: number }> = [
      { ratio: 0.5, amp: 0.052, decay: 3.9, detune: 0.0 },
      { ratio: 1.0, amp: 0.088, decay: 3.2, detune: -0.9 },
      { ratio: 1.003, amp: 0.048, decay: 3.1, detune: 1.1 },
      { ratio: 1.196, amp: 0.042, decay: 2.4, detune: 0.5 },
      { ratio: 1.505, amp: 0.032, decay: 1.9, detune: -0.6 },
      { ratio: 2.0, amp: 0.056, decay: 2.0, detune: 0.8 },
      { ratio: 2.756, amp: 0.028, decay: 1.25, detune: -1.2 },
      { ratio: 4.07, amp: 0.018, decay: 0.72, detune: 1.4 },
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0 * p.ratio + p.detune, t);
      gain.gain.setValueAtTime(0.0005, t);
      gain.gain.linearRampToValueAtTime(p.amp * volScale, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0004, t + p.decay);
      osc.connect(gain);
      gain.connect(masterFilter);
      osc.start(t);
      osc.stop(t + p.decay + 0.05);
    }
  }

  public playBellChime(): void {
    // Gentle temple/singing-bowl chime when discovering landmarks
    if (this.currentZone === 'temple-courtyard') {
      this.playTempleBell(0.75, 1.15);
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playTone(528, 0.75, 'sine', 0.065);
    this.playTone(792, 0.58, 'sine', 0.035);
    this.playTone(1056, 0.42, 'sine', 0.018);
  }

  public playClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playTone(640, 0.06, 'sine', 0.045);
  }

  public playPropBump(): void {
    this.playPropImpact('crate', 0.8);
  }

  public playPropImpact(kind: string, intensity = 1.0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const vol = Math.max(0.015, Math.min(0.09, 0.052 * intensity));
    if (kind === 'pot') {
      const f = 320 + Math.random() * 80;
      this.playTone(f, 0.11, 'sine', vol);
      this.playTone(f * 1.52, 0.07, 'triangle', vol * 0.55);
    } else if (kind === 'case') {
      const f = 410 + Math.random() * 90;
      this.playTone(f, 0.08, 'triangle', vol * 0.9);
      this.playTone(f * 2.2, 0.05, 'sine', vol * 0.4);
    } else if (kind === 'block' || kind === 'cairn') {
      const f = 135 + Math.random() * 35;
      this.playTone(f, 0.085, 'triangle', vol * 1.1);
      this.playTone(f * 1.85, 0.04, 'sine', vol * 0.45);
    } else if (kind === 'ball') {
      const f = 185 + Math.random() * 40;
      this.playTone(f, 0.12, 'sine', vol);
    } else {
      const f = 195 + (Math.random() - 0.5) * 45;
      this.playTone(f, 0.075, 'triangle', vol);
      this.playTone(f * 2.1, 0.035, 'sine', vol * 0.35);
    }
  }

  public playWaterSplash(intensity = 1.0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const vol = Math.max(0.02, Math.min(0.11, 0.065 * intensity));
    const buf = this.createPinkNoiseBuffer(ctx, 0.24);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1250, t);
    bp.frequency.exponentialRampToValueAtTime(480, t + 0.22);
    bp.Q.value = 0.95;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.24);
    this.playTone(540 + Math.random() * 180, 0.09, 'sine', vol * 0.35);
  }

  public playFoliageRustle(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const buf = this.createPinkNoiseBuffer(ctx, 0.22);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1400, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.004, t);
    g.gain.linearRampToValueAtTime(0.042, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
    src.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.22);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  public dispose(): void {
    for (const node of [
      this.windNoiseSrc,
      this.windLfo,
      this.rustleLfo,
      this.ambientPadOsc1,
      this.ambientPadOsc2,
      this.ambientPadLfo,
    ]) {
      if (node) {
        try {
          node.stop();
        } catch {
          // ignore if already stopped
        }
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
    this.windStarted = false;
  }
}

export const soundEngine = new SoundEngine();
