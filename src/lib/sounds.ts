// ============================================
// Focus Forest — Procedural Ambient Sound Engine
// (Web Audio API — no audio files needed)
// ============================================

type SoundType = 'rain' | 'forest' | 'waves' | 'fire' | 'wind' | 'brown' | 'white' | 'silence';

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
