// Simple Web Audio API Synthesizer to prevent loading audio file lag
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playSound = {
  click: (enabled: boolean = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio Context block', e);
    }
  },

  success: (enabled: boolean = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Play a quick pentatonic ascending chime (perfect for Chinese theme!)
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.06);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + index * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.15);
      });
    } catch (e) {
      console.warn(e);
    }
  },

  failure: (enabled: boolean = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      // Low pass filter to make it dull/heavy
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  },

  levelUp: (enabled: boolean = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Rising major chords
      const chords = [
        [261.63, 329.63, 392.00], // C4 Major
        [329.63, 415.30, 493.88], // E4 Major
        [392.00, 493.88, 587.33], // G4 Major
        [523.25, 659.25, 783.99, 1046.50] // C5 Major chord with double root
      ];

      chords.forEach((freqs, chordIndex) => {
        const chordTime = now + chordIndex * 0.15;
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, chordTime);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.03, chordTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(chordTime);
          osc.stop(chordTime + 0.4);
        });
      });
    } catch (e) {
      console.warn(e);
    }
  }
};
