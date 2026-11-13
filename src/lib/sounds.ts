// ============================================
// Focus Forest — Procedural Ambient Sound Engine
// (Web Audio API — no audio files needed)
// ============================================

type SoundType = 'rain' | 'forest' | 'waves' | 'fire' | 'wind' | 'brown' | 'white' | 'thunder' | 'cafe' | 'lofi' | 'library' | 'silence';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeType: SoundType | null = null;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(vol: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx!.currentTime, 0.1);
    }
  }

  play(type: SoundType, volume: number = 0.5) {
    if (type === 'silence') {
      this.stop();
      return;
    }

    // If same sound, just update volume
    if (this.activeType === type && this.isPlaying) {
      this.setVolume(volume);
      return;
    }

    this.stop();
    const ctx = this.getContext();
    this.setVolume(volume);
    this.activeType = type;
    this.isPlaying = true;

    switch (type) {
      case 'white': this.createWhiteNoise(ctx); break;
      case 'brown': this.createBrownNoise(ctx); break;
      case 'rain': this.createRain(ctx); break;
      case 'forest': this.createForest(ctx); break;
      case 'waves': this.createWaves(ctx); break;
      case 'fire': this.createFire(ctx); break;
      case 'wind': this.createWind(ctx); break;
      case 'thunder': this.createThunder(ctx); break;
      case 'cafe': this.createCafe(ctx); break;
      case 'lofi': this.createLofi(ctx); break;
      case 'library': this.createLibrary(ctx); break;
    }
  }

  stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch { /* already stopped */ }
    });
    this.activeNodes = [];
    this.activeType = null;
    this.isPlaying = false;
  }

  getActiveType(): SoundType | null {
    return this.activeType;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.ctx = null;
    this.masterGain = null;
  }

  // ─── Sound Generators ──────────────────────

  private createNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createLoopingNoise(ctx: AudioContext): AudioBufferSourceNode {
    const buffer = this.createNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    this.activeNodes.push(source);
    return source;
  }

  private createWhiteNoise(ctx: AudioContext) {
    const noise = this.createLoopingNoise(ctx);
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    noise.connect(gain);
    gain.connect(this.masterGain!);
    this.activeNodes.push(gain);
  }

  private createBrownNoise(ctx: AudioContext) {
    const noise = this.createLoopingNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    this.activeNodes.push(filter, gain);
  }

  private createRain(ctx: AudioContext) {
    // Layered filtered noise for rain
    const noise = this.createLoopingNoise(ctx);

    // Main rain body
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.3;
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.25;
    noise.connect(bp);
    bp.connect(gain1);
    gain1.connect(this.masterGain!);

    // Low rumble
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.15;
    noise.connect(lp);
    lp.connect(gain2);
    gain2.connect(this.masterGain!);

    // High patter
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const gain3 = ctx.createGain();
    gain3.gain.value = 0.08;
    noise.connect(hp);
    hp.connect(gain3);
    gain3.connect(this.masterGain!);

    this.activeNodes.push(bp, lp, hp, gain1, gain2, gain3);
  }

  private createForest(ctx: AudioContext) {
    // Gentle wind (brown noise, very soft)
    const noise = this.createLoopingNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.08;
    noise.connect(lp);
    lp.connect(windGain);
    windGain.connect(this.masterGain!);

    // Occasional bird chirps using oscillators
    this.scheduleBirdChirps(ctx);

    this.activeNodes.push(lp, windGain);
  }

  private scheduleBirdChirps(ctx: AudioContext) {
    const scheduleChirp = () => {
      if (!this.isPlaying || this.activeType !== 'forest') return;

      const now = ctx.currentTime;
      const freq = 2000 + Math.random() * 3000;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.1);

      const chirpGain = ctx.createGain();
      chirpGain.gain.setValueAtTime(0, now);
      chirpGain.gain.linearRampToValueAtTime(0.03, now + 0.02);
      chirpGain.gain.linearRampToValueAtTime(0, now + 0.15);

      osc.connect(chirpGain);
      chirpGain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.2);

      // Schedule next chirp
      const delay = 2000 + Math.random() * 5000;
      setTimeout(scheduleChirp, delay);
    };

    setTimeout(scheduleChirp, 1000);
  }

  private createWaves(ctx: AudioContext) {
    const noise = this.createLoopingNoise(ctx);

    // Bandpass for wave body
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 800;
    bp.Q.value = 0.5;

    // LFO to modulate volume (wave rhythm)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow wave rhythm
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);

    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.2;
    lfoGain.connect(waveGain.gain);

    noise.connect(bp);
    bp.connect(waveGain);
    waveGain.connect(this.masterGain!);
    lfo.start();

    this.activeNodes.push(bp, lfo, lfoGain, waveGain);
  }

  private createFire(ctx: AudioContext) {
    const noise = this.createLoopingNoise(ctx);

    // Crackle: bandpass filtered noise
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 2;

    // Warmth: low rumble
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.12;
    const warmGain = ctx.createGain();
    warmGain.gain.value = 0.2;

    noise.connect(bp);
    bp.connect(crackleGain);
    crackleGain.connect(this.masterGain!);

    noise.connect(lp);
    lp.connect(warmGain);
    warmGain.connect(this.masterGain!);

    this.activeNodes.push(bp, lp, crackleGain, warmGain);
  }

  private createWind(ctx: AudioContext) {
    const noise = this.createLoopingNoise(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 400;
    bp.Q.value = 0.3;

    // Slow modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    const windGain = ctx.createGain();
    windGain.gain.value = 0.2;

    noise.connect(bp);
    bp.connect(windGain);
    windGain.connect(this.masterGain!);
    lfo.start();

    this.activeNodes.push(bp, lfo, lfoGain, windGain);
  }

  private createThunder(ctx: AudioContext) {
    // Rain background + low frequency resonant rumble
    this.createRain(ctx);

    const scheduleThunder = () => {
      if (!this.isPlaying || this.activeType !== 'thunder') return;
      const now = ctx.currentTime;
      const noise = this.createNoiseBuffer(ctx, 3);
      const src = ctx.createBufferSource();
      src.buffer = noise;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(140, now);
      lp.frequency.linearRampToValueAtTime(70, now + 1.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      src.connect(lp);
      lp.connect(gain);
      gain.connect(this.masterGain!);
      src.start(now);
      src.stop(now + 2.8);

      const nextDelay = 8000 + Math.random() * 12000;
      setTimeout(scheduleThunder, nextDelay);
    };

    setTimeout(scheduleThunder, 2500);
  }

  private createCafe(ctx: AudioContext) {
    // Warm background murmur with multi-frequency filter
    const noise = this.createLoopingNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.16;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    this.activeNodes.push(filter, gain);

    // Periodic gentle cup clinks
    const scheduleClink = () => {
      if (!this.isPlaying || this.activeType !== 'cafe') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400 + Math.random() * 800, now);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.04, now + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.15);

      const nextDelay = 4000 + Math.random() * 9000;
      setTimeout(scheduleClink, nextDelay);
    };

    setTimeout(scheduleClink, 3000);
  }

  private createLofi(ctx: AudioContext) {
    // 1. Vinyl crackle / subtle background warmth
    const noise = this.createLoopingNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 3.0;
    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.05;

    noise.connect(filter);
    filter.connect(vinylGain);
    vinylGain.connect(this.masterGain!);
    this.activeNodes.push(filter, vinylGain);

    // 2. Mellow chillout triad chord pad (Eb3 - G3 - Bb3)
    const chordFrequencies = [155.56, 196.00, 233.08];
    const padGain = ctx.createGain();
    padGain.gain.value = 0.07;
    padGain.connect(this.masterGain!);
    this.activeNodes.push(padGain);

    chordFrequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;

      // Slow gentle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 0.25;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 1.2;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start();

      osc.connect(lp);
      lp.connect(padGain);
      osc.start();

      this.activeNodes.push(osc, lp, vibrato, vibratoGain);
    });
  }

  private createLibrary(ctx: AudioContext) {
    // Calm room tone resonance
    const noise = this.createLoopingNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 280;
    lp.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0.22;

    noise.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain!);
    this.activeNodes.push(lp, gain);

    // Gentle occasional page swoosh
    const schedulePageTurn = () => {
      if (!this.isPlaying || this.activeType !== 'library') return;
      const now = ctx.currentTime;
      const swoosh = ctx.createBufferSource();
      swoosh.buffer = this.createNoiseBuffer(ctx, 1.2);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(800, now);
      bp.frequency.linearRampToValueAtTime(450, now + 0.8);
      bp.Q.value = 1.8;

      const swooshGain = ctx.createGain();
      swooshGain.gain.setValueAtTime(0, now);
      swooshGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      swoosh.connect(bp);
      bp.connect(swooshGain);
      swooshGain.connect(this.masterGain!);
      swoosh.start(now);
      swoosh.stop(now + 1.0);

      const nextDelay = 12000 + Math.random() * 16000;
      setTimeout(schedulePageTurn, nextDelay);
    };

    setTimeout(schedulePageTurn, 6000);
  }

  // ─── Notification Sounds ───────────────────

  playCompletionChime() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const t = now + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playFailureSound() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  playAchievementSound() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Sparkle arpeggio
    const notes = [783.99, 987.77, 1174.66, 1567.98, 1174.66, 1567.98]; // G5, B5, D6, G6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}

// Singleton
export const soundEngine = new AmbientSoundEngine();
