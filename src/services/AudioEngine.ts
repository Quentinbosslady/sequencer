/**
 * Web Audio API Sound Synthesis and Scheduling
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private scheduleAheadTime: number = 0.1; // seconds
  private lookahead: number = 25.0; // milliseconds
  private timerID: number | null = null;
  
  private bpm: number = 120;
  private currentStep: number = 0;
  private onStep: (step: number) => void;

  constructor(onStep: (step: number) => void) {
    this.onStep = onStep;
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  start(tracks: any[]) {
    this.initCtx();
    this.nextNoteTime = this.ctx!.currentTime;
    this.scheduler(tracks);
  }

  stop() {
    if (this.timerID) {
      clearTimeout(this.timerID);
    }
    this.currentStep = 0;
  }

  private scheduler(tracks: any[]) {
    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime, tracks);
      this.nextStep();
    }
    this.timerID = window.setTimeout(() => this.scheduler(tracks), this.lookahead);
  }

  private nextStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleNote(step: number, time: number, tracks: any[]) {
    this.onStep(step);
    
    tracks.forEach(track => {
      if (track.steps[step].active) {
        this.playTrack(track.type, time);
      }
    });
  }

  private playTrack(type: string, time: number) {
    if (!this.ctx) return;

    switch (type) {
      case 'kick':
        this.playKick(time);
        break;
      case 'snare':
        this.playSnare(time);
        break;
      case 'hihat':
        this.playHiHat(time);
        break;
      case 'synth':
        this.playSynth(time);
        break;
    }
  }

  private playKick(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    const noise = this.ctx!.createBufferSource();
    const buffer = this.ctx!.createBuffer(1, this.ctx!.sampleRate * 0.1, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);

    const noiseEnvelope = this.ctx!.createGain();
    noiseEnvelope.gain.setValueAtTime(1, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(this.ctx!.destination);

    const osc = this.ctx!.createOscillator();
    osc.type = 'triangle';
    const oscEnvelope = this.ctx!.createGain();
    oscEnvelope.gain.setValueAtTime(0.7, time);
    oscEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscEnvelope);
    oscEnvelope.connect(this.ctx!.destination);

    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.1);
    osc.stop(time + 0.1);
  }

  private playHiHat(time: number) {
    const noise = this.ctx!.createBufferSource();
    const buffer = this.ctx!.createBuffer(1, this.ctx!.sampleRate * 0.05, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    noise.connect(filter);

    const envelope = this.ctx!.createGain();
    envelope.gain.setValueAtTime(0.3, time);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    filter.connect(envelope);
    envelope.connect(this.ctx!.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playSynth(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, time);
    
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }
}
