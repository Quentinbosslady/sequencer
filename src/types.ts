export interface Step {
  active: boolean;
}

export interface Track {
  id: string;
  name: string;
  color: string;
  steps: Step[];
  type: 'kick' | 'snare' | 'hihat' | 'synth';
}

export interface SequencerState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  tracks: Track[];
}
