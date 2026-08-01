// Procedural Web Audio API sound generator for Nekomon Game Companion.
// No external assets are loaded to guarantee 100% offline-ready reliability, zero latency, and zero CORS issues.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmInterval: any = null;
  private isBgmPlaying = false;
  private masterVolume = 0.15; // Safe comfortable master volume

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Plays a procedural retro chime
  playCaptureSound() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    
    gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 1. Plays the dramatic Forging rumble/sweep
  playForgingSound() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 3.8; // Match the 4-second delay

    // Low rumble oscillator
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(60, now);
    rumble.frequency.linearRampToValueAtTime(140, now + duration);

    // Rising energy sweep oscillator
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = "triangle";
    sweep.frequency.setValueAtTime(120, now);
    sweep.frequency.exponentialRampToValueAtTime(900, now + duration);

    // Resonant bandpass filter to create a sweeping "whoosh"
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(4, now);
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + duration);

    // Connect nodes
    rumbleGain.gain.setValueAtTime(0.05 * this.masterVolume, now);
    rumbleGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + duration - 0.4);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    sweepGain.gain.setValueAtTime(0.02 * this.masterVolume, now);
    sweepGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + duration - 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    rumble.connect(rumbleGain);
    sweep.connect(sweepGain);

    rumbleGain.connect(filter);
    sweepGain.connect(filter);
    filter.connect(this.ctx.destination);

    rumble.start(now);
    sweep.start(now);

    rumble.stop(now + duration);
    sweep.stop(now + duration);
  }

  // 2. Plays a custom success reveal fanfare depending on style
  playRevealSound(style: "Sentinel" | "Scourge") {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (style === "Sentinel") {
      // Sentinel/Ghibli: cozy, magical, soft harp arpeggio (C Major 9)
      const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
      notes.forEach((freq, i) => {
        const timeOffset = i * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        
        // Add light vibrato
        osc.frequency.linearRampToValueAtTime(freq + 4, now + timeOffset + 0.3);

        gain.gain.setValueAtTime(0, now + timeOffset);
        gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + timeOffset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 1.5);
      });
    } else {
      // Scourge/Mappa: modern dynamic high-contrast synth sweep (A minor chord with laser glide)
      const notes = [220.00, 261.63, 329.63, 440.00]; // A3, C4, E4, A4
      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // Combines sharp saw/triangle for aggressive mapping style
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        // Quick upward frequency bend (laser attack)
        osc.frequency.exponentialRampToValueAtTime(freq * 2.0, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22 * this.masterVolume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 1.8);
      });
    }
  }

  // 3. Start cute retro cozy game BGM (Cozy Anime Lofi theme)
  startBGM() {
    this.init();
    if (!this.ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    let step = 0;
    // A beautiful cozy pentatonic melody loop: C4, D4, E4, G4, A4, C5
    const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const sequence = [
      0, 2, 3, 5, 
      4, 3, 2, 0, 
      1, 3, 4, 3, 
      2, 5, 4, 1
    ];
    
    // Play warm background synth chords continuously
    const playChord = (rootFreq: number, duration: number) => {
      if (!this.ctx || !this.isBgmPlaying) return;
      const now = this.ctx.currentTime;
      
      const freqs = [rootFreq, rootFreq * 1.2, rootFreq * 1.5]; // Triad
      freqs.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03 * this.masterVolume, now + 1.0);
        gain.gain.linearRampToValueAtTime(0.03 * this.masterVolume, now + duration - 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.start(now);
        osc.stop(now + duration);
      });
    };

    // Main sequencer step
    const playNextStep = () => {
      if (!this.ctx || !this.isBgmPlaying) return;
      const now = this.ctx.currentTime;

      // Play melody note
      const noteIdx = sequence[step % sequence.length];
      const freq = melody[noteIdx];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle"; // Warm retro cozy tone
      osc.frequency.setValueAtTime(freq, now);
      
      // Gentle slide/portamento
      osc.frequency.linearRampToValueAtTime(freq * 1.01, now + 0.35);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04 * this.masterVolume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);

      // Trigger warm pad chord every 4 beats (2 seconds)
      if (step % 4 === 0) {
        const chordRoots = [196.00, 220.00, 174.61, 261.63]; // G3, A3, F3, C4
        const root = chordRoots[Math.floor(step / 4) % chordRoots.length];
        playChord(root, 2.0);
      }

      step++;
    };

    // Run melody steps at 120 BPM (0.5 seconds per step)
    this.bgmInterval = setInterval(playNextStep, 500);
    playNextStep();
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  getPlayingStatus() {
    return this.isBgmPlaying;
  }

  // Plays procedural element-specific sound effects (Fire, Water, Earth, Wind, Lightning)
  playElementSound(element: string) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const el = element ? element.toLowerCase().trim() : "";

    const isFire = el.includes("api") || el.includes("fire");
    const isWater = el.includes("air") || el.includes("water") || el.includes("aqua");
    const isEarth = el.includes("tanah") || el.includes("earth");
    const isWind = el.includes("angin") || el.includes("wind");
    const isLightning = el.includes("petir") || el.includes("thunder") || el.includes("lightning") || el.includes("electric");

    if (isFire) {
      // Fire (Api): Roaring flame crackle & fiery Whoosh sweep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.42);
      osc2.frequency.setValueAtTime(360, now);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.42);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.42);

      gain.gain.setValueAtTime(0.32 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (isWater) {
      // Water (Air): Sparkling bubble droplet splash cascade
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const timeOffset = idx * 0.055;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + timeOffset + 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + timeOffset + 0.18);

        gain.gain.setValueAtTime(0.22 * this.masterVolume, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.24);
      });
    } else if (isEarth) {
      // Earth (Tanah): Heavy seismic rock impact rumble
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      subOsc.type = "sine";

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(25, now + 0.45);

      subOsc.frequency.setValueAtTime(60, now);
      subOsc.frequency.linearRampToValueAtTime(18, now + 0.45);

      gain.gain.setValueAtTime(0.45 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 0.48);
      subOsc.stop(now + 0.48);
    } else if (isWind) {
      // Wind (Angin): Whistling dual gale whoosh swirl
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(1150, now + 0.2);
      osc1.frequency.exponentialRampToValueAtTime(360, now + 0.45);

      osc2.frequency.setValueAtTime(660, now);
      osc2.frequency.exponentialRampToValueAtTime(1380, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(540, now + 0.45);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.24 * this.masterVolume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.48);
      osc2.stop(now + 0.48);
    } else if (isLightning) {
      // Lightning (Petir): High voltage electric crackle & spark discharge
      const notes = [1350, 320, 1850, 480, 1600, 220];
      notes.forEach((freq, idx) => {
        const timeOffset = idx * 0.042;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.25, now + timeOffset + 0.05);

        gain.gain.setValueAtTime(0.28 * this.masterVolume, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.065);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.075);
      });
    } else {
      // Default slice chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    }
  }

  // Plays a dynamic unboxing burst sound that adjusts to the card element
  playUnboxingExplosion(element: string) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const el = element ? element.toLowerCase() : "";

    // Heavy baseline rumbling bass thump for impact
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(110, now);
    bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.55);

    bassGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    bassOsc.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.6);

    if (el === "api") {
      // Fire explosion crackle and high sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
      osc.frequency.linearRampToValueAtTime(140, now + 0.75);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.75);

      gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } else if (el === "air") {
      // Water splash spray
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.45);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.85);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } else if (el === "tanah") {
      // Deep heavy earth breakdown
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.linearRampToValueAtTime(25, now + 0.8);

      gain.gain.setValueAtTime(0.55 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } else if (el === "angin") {
      // Wind tornado whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.5);
      osc.frequency.linearRampToValueAtTime(280, now + 0.85);

      gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } else if (el === "petir") {
      // Electric sparkle crackle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2100, now);
      osc.frequency.setValueAtTime(320, now + 0.08);
      osc.frequency.setValueAtTime(1700, now + 0.16);
      osc.frequency.setValueAtTime(450, now + 0.24);

      gain.gain.setValueAtTime(0.32 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } else {
      // Normal cute chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.55); // C6

      gain.gain.setValueAtTime(0.24 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    }
  }

  // Plays victory / level up fanfare sound effect
  playVictory() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const timeOffset = idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.28 * this.masterVolume, now + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.38);
    });
  }

  // Aliases for RewardedAdModal and other flows
  playCaptureSuccess() {
    this.playCaptureSound();
  }

  playLevelUp() {
    this.playVictory();
  }
}

export const audio = new AudioEngine();
