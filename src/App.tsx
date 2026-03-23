/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AudioEngine } from './services/AudioEngine';
import { SequencerState, Track } from './types';
import { cn } from './lib/utils';

const INITIAL_TRACKS: Track[] = [
  {
    id: 'kick',
    name: 'KICK',
    color: '#ff3b3b', // Red
    type: 'kick',
    steps: Array(16).fill(null).map(() => ({ active: false })),
  },
  {
    id: 'snare',
    name: 'SNARE',
    color: '#33ff57', // Green
    type: 'snare',
    steps: Array(16).fill(null).map(() => ({ active: false })),
  },
  {
    id: 'hihat',
    name: 'HI-HAT',
    color: '#ffeb3b', // Yellow
    type: 'hihat',
    steps: Array(16).fill(null).map(() => ({ active: false })),
  },
  {
    id: 'synth',
    name: 'SYNTH',
    color: '#33d1ff', // Blue
    type: 'synth',
    steps: Array(16).fill(null).map(() => ({ active: false })),
  },
];

export default function App() {
  const [state, setState] = useState<SequencerState>({
    isPlaying: false,
    bpm: 120,
    currentStep: -1,
    tracks: INITIAL_TRACKS,
  });

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine((step) => {
      setState(prev => ({ ...prev, currentStep: step }));
    });
    return () => audioEngineRef.current?.stop();
  }, []);

  const togglePlay = () => {
    if (state.isPlaying) {
      audioEngineRef.current?.stop();
      setState(prev => ({ ...prev, isPlaying: false, currentStep: -1 }));
    } else {
      audioEngineRef.current?.setBpm(state.bpm);
      audioEngineRef.current?.start(state.tracks);
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const updateBpm = (newBpm: number) => {
    const clampedBpm = Math.min(Math.max(newBpm, 40), 280);
    setState(prev => ({ ...prev, bpm: clampedBpm }));
    audioEngineRef.current?.setBpm(clampedBpm);
  };

  const toggleStep = (trackId: string, stepIndex: number) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          const newSteps = [...track.steps];
          newSteps[stepIndex] = { ...newSteps[stepIndex], active: !newSteps[stepIndex].active };
          return { ...track, steps: newSteps };
        }
        return track;
      }),
    }));
  };

  const resetGrid = () => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => ({
        ...t,
        steps: Array(16).fill(null).map(() => ({ active: false }))
      }))
    }));
  };

  // Calculate knob rotation
  const knobRotation = ((state.bpm - 40) / (280 - 40)) * 270 - 135;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#111]">
      {/* Hardware Module Container */}
      <div className="relative">
        {/* Main Faceplate */}
        <div className="brushed-metal w-[420px] rounded-sm p-10 flex flex-col items-center border-x-2 border-t-2 border-[#999] border-b-4 border-[#666] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          
          {/* Corner Screws */}
          <div className="absolute top-4 left-4 screw" />
          <div className="absolute top-4 right-4 screw" />
          <div className="absolute bottom-4 left-4 screw" />
          <div className="absolute bottom-4 right-4 screw" />

          {/* Top Label */}
          <div className="mb-8 w-full flex justify-center">
            <div className="bg-black/80 text-white px-6 py-1 text-xs font-bold tracking-[0.5em] border border-white/10 shadow-inner">
              GAMESYSTEM
            </div>
          </div>

          {/* LED Matrix Display Area */}
          <div className="relative w-full mb-10">
            {/* Side Buttons for the Screen */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-12">
              <div className="flex flex-col items-center">
                <button onClick={togglePlay} className="w-6 h-6 bg-[#222] rounded-full border-2 border-[#444] active:translate-y-0.5 shadow-lg" />
                <span className="text-[7px] font-bold mt-1 text-black/60">GAME</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-6 h-6 bg-[#222] rounded-full border-2 border-[#444] active:translate-y-0.5 shadow-lg" />
                <span className="text-[7px] font-bold mt-1 text-black/60">MODE</span>
              </div>
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-12">
              <div className="flex flex-col items-center">
                <button onClick={resetGrid} className="w-6 h-6 bg-[#222] rounded-full border-2 border-[#444] active:translate-y-0.5 shadow-lg" />
                <span className="text-[7px] font-bold mt-1 text-black/60">RESET</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-6 h-6 bg-[#222] rounded-full border-2 border-[#444] active:translate-y-0.5 shadow-lg" />
                <span className="text-[7px] font-bold mt-1 text-black/60">CLOCK</span>
              </div>
            </div>

            {/* The actual LED Screen */}
            <div className="led-screen p-3 rounded-sm w-full aspect-square flex flex-col gap-1.5 overflow-hidden">
              {state.tracks.map((track) => (
                <div key={track.id} className="flex-1 grid grid-cols-16 gap-1.5">
                  {track.steps.map((step, i) => (
                    <div
                      key={i}
                      onClick={() => toggleStep(track.id, i)}
                      className={cn(
                        "w-full h-full transition-all duration-75 cursor-pointer relative",
                        step.active 
                          ? "shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]" 
                          : "bg-[#1a1a1a] shadow-inner",
                        state.currentStep === i && !step.active && "bg-[#333]",
                        state.currentStep === i && step.active && "brightness-125 scale-[1.05]"
                      )}
                      style={{
                        backgroundColor: step.active ? track.color : undefined,
                        boxShadow: step.active ? `0 0 15px ${track.color}88, inset 0 0 5px rgba(255,255,255,0.5)` : undefined
                      }}
                    >
                      {/* Pixel texture */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:3px_3px]" />
                    </div>
                  ))}
                </div>
              ))}
              {/* Fill the rest of the 8x8 look with empty rows if needed, but we have 4 tracks of 16 steps. 
                  In the image it's 8x8. Let's add 4 more empty rows to match the visual density. */}
              {Array(4).fill(null).map((_, rowIndex) => (
                <div key={`empty-${rowIndex}`} className="flex-1 grid grid-cols-16 gap-1.5 opacity-20">
                  {Array(16).fill(null).map((_, i) => (
                    <div key={i} className="w-full h-full bg-[#1a1a1a] shadow-inner" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Patch Jacks Grid */}
          <div className="w-full border-y-[1.5px] border-black/40 py-8 mb-10 grid grid-cols-4 gap-y-8 gap-x-4 relative">
            {/* Vertical lines to match the image's grid look */}
            <div className="absolute inset-0 pointer-events-none flex justify-between px-2">
              <div className="w-[1px] h-full bg-black/10" />
              <div className="w-[1px] h-full bg-black/10" />
              <div className="w-[1px] h-full bg-black/10" />
            </div>

            {['BUTTON', 'MODE', 'RESET', 'CLOCK'].map(label => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="patch-jack" />
                <span className="text-[8px] font-black tracking-tighter text-black/70">{label}</span>
              </div>
            ))}
            {['LEFT', 'RIGHT', 'UP', 'DOWN'].map(label => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="patch-jack" />
                <span className="text-[8px] font-black tracking-tighter text-black/70">{label}</span>
              </div>
            ))}
            {['1 OUT', '2 OUT', '3 OUT', '4 OUT'].map(label => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="patch-jack" />
                <span className="text-[8px] font-black tracking-tighter text-black/70">{label}</span>
              </div>
            ))}
          </div>

          {/* Large Main Knob */}
          <div className="flex flex-col items-center mb-10 relative">
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-32 bg-black/5 rounded-full blur-xl pointer-events-none" />
            <div 
              ref={knobRef}
              className="knob-large active:scale-95 transition-transform duration-75"
              style={{ transform: `rotate(${knobRotation}deg)` }}
              onWheel={(e) => {
                e.preventDefault();
                updateBpm(state.bpm - Math.sign(e.deltaY) * 2);
              }}
              onClick={() => updateBpm(state.bpm + 5)}
            >
              <div className="knob-indicator" />
              {/* Grip texture on the knob */}
              <div className="absolute inset-0 rounded-full opacity-20 bg-[repeating-conic-gradient(from_0deg,#000_0deg_10deg,#fff_10deg_20deg)] mix-blend-overlay" />
            </div>
            <span className="text-[9px] font-black mt-6 text-black/80 tracking-widest uppercase">[BUTTON]</span>
            <div className="mt-2 bg-black/90 px-3 py-0.5 rounded-sm">
              <span className="text-[10px] font-mono font-bold text-pink-500">{state.bpm} BPM</span>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="w-full flex justify-between items-end mt-4">
            <div className="flex gap-3">
              <div className="screw scale-[0.6] opacity-80" />
              <div className="screw scale-[0.6] opacity-80" />
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm font-black tracking-[-0.05em] text-black/90">
                DIGITAL<span className="opacity-30 mx-1.5 font-light">|</span>PGH
              </div>
              <div className="text-[6px] font-bold text-black/40 tracking-[0.2em] mt-0.5">MADE IN PITTSBURGH</div>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-cols-16 {
          grid-template-columns: repeat(16, minmax(0, 1fr));
        }
        body {
          overflow: hidden;
          cursor: default;
        }
      `}} />
    </div>
  );
}
