/**
 * Web Audio API synthesizer for stadium sound effects.
 * Avoids the need for external static assets and runs 100% locally.
 */

class StadiumAudioSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Helper to create a noise buffer for crowd sounds
  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Referee Whistle
  public playWhistle() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Create two high-pitched oscillators to create a beating effect
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1800, now);
      // Fast pitch vibrato
      osc1.frequency.linearRampToValueAtTime(1830, now + 0.1);
      osc1.frequency.linearRampToValueAtTime(1770, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(1800, now + 0.35);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1815, now); // slightly different to create beating
      osc2.frequency.linearRampToValueAtTime(1845, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(1785, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(1815, now + 0.35);

      // Create a rapid amplitude modulation (tremolo) to simulate the whistle ball
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 35; // 35 Hz flutter
      lfoGain.gain.value = 0.2;

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      // Main volume envelope
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.03); // quick attack
      gainNode.gain.setValueAtTime(0.3, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45); // quick decay

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + 0.5);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.error("Synthesizer failed to play Whistle:", e);
    }
  }

  // 2. Crowd Roar
  public playRoar() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Create noise source
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      // Filter noise to sound like a distant crowd (low-mid rumble)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(250, now);
      filter.Q.setValueAtTime(1.2, now);
      
      // Sweep the filter frequency higher as the roar builds
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(200, now + 2.0);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.15); // rapid surge
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 1.2); // gradual fade
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // long tail

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 2.5);
    } catch (e) {
      console.error("Synthesizer failed to play Roar:", e);
    }
  }

  // 3. Crowd Groan/Sigh
  public playSigh() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, now);
      // Sweep filter down representing disappointment
      filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1); // moderate attack
      gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.9); // fade
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 1.5);
    } catch (e) {
      console.error("Synthesizer failed to play Sigh:", e);
    }
  }

  // 4. Stadium Airhorn
  public playAirhorn() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const duration = 0.8;
      // Airhorns use heavy sawtooth harmonics
      const frequencies = [180, 270, 360, 540];
      const gainNode = ctx.createGain();
      
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02); // rapid turn-on
      gainNode.gain.setValueAtTime(0.2, now + duration - 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Filter to shape the metallic horn sound
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = 1000;
      filter.Q.value = 1.5;
      filter.gain.value = 4;

      const oscs: OscillatorNode[] = [];
      frequencies.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, now);
        // Add tiny pitch modulation for realism
        osc.frequency.linearRampToValueAtTime(f + 2, now + duration);
        osc.connect(gainNode);
        oscs.push(osc);
      });

      gainNode.connect(filter);
      filter.connect(ctx.destination);

      oscs.forEach((osc) => osc.start(now));
      oscs.forEach((osc) => osc.stop(now + duration));
    } catch (e) {
      console.error("Synthesizer failed to play Airhorn:", e);
    }
  }

  // 5. Tension Gasp
  public playGasp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2, now);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.25); // slow intake gasp
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45); // rapid shut

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {
      console.error("Synthesizer failed to play Gasp:", e);
    }
  }

  // Trigger by sound ID
  public trigger(soundId: string) {
    switch (soundId) {
      case "whistle":
        this.playWhistle();
        break;
      case "roar":
        this.playRoar();
        break;
      case "sigh":
        this.playSigh();
        break;
      case "airhorn":
        this.playAirhorn();
        break;
      case "gasp":
        this.playGasp();
        break;
      default:
        console.warn(`Sound ID '${soundId}' not recognized.`);
    }
  }
}

export const audioSynth = new StadiumAudioSynth();
export default audioSynth;
