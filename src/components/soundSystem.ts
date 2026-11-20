/* ============================================================
   Sound System — Web Audio API (គ្មាន file ខាងក្រៅ)
   បង្កើតសំឡេងបក្សី, ខ្យល់, ទឹកភ្លៀង ដោយ synthesized
   ============================================================ */

export interface SoundSystem {
  context: AudioContext | null;
  ambientGain: GainNode | null;
  rainGain: GainNode | null;
  windGain: GainNode | null;
  birdGain: GainNode | null;
  waterfallGain: GainNode | null;
  beeGain: GainNode | null;
  enabled: boolean;
}

export function createSoundSystem(): SoundSystem {
  return {
    context: null,
    ambientGain: null,
    rainGain: null,
    windGain: null,
    birdGain: null,
    waterfallGain: null,
    beeGain: null,
    enabled: false,
  };
}

/* Initialize Audio Context (ត្រូវហៅពី user gesture) */
export function initSound(sys: SoundSystem): void {
  if (sys.context) {
    if (sys.context.state === "suspended") sys.context.resume();
    return;
  }

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    sys.context = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);

    sys.ambientGain = masterGain;
    sys.enabled = true;

    // --- សំឡេងខ្យល់ (white noise filtered) ---
    const windGain = ctx.createGain();
    windGain.gain.value = 0.15;
    windGain.connect(masterGain);
    sys.windGain = windGain;

    const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windData.length; i++) {
      windData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const windSource = ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    // Filter (lowpass)
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 400;
    windFilter.Q.value = 1;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windSource.start();

    // --- សំឡេងទឹកភ្លៀង (rain noise) ---
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0; // បិទលំនាំដើម
    rainGain.connect(masterGain);
    sys.rainGain = rainGain;

    const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    for (let i = 0; i < rainData.length; i++) {
      rainData[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "highpass";
    rainFilter.frequency.value = 800;

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainSource.start();

    // --- សំឡេងបក្សី (random chirps) ---
    const birdGain = ctx.createGain();
    birdGain.gain.value = 0;
    birdGain.connect(masterGain);
    sys.birdGain = birdGain;

    // --- សំឡេងទឹកជ្រោះ (waterfall noise) ---
    const waterfallGain = ctx.createGain();
    waterfallGain.gain.value = 0;
    waterfallGain.connect(masterGain);
    sys.waterfallGain = waterfallGain;

    const waterfallBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const waterfallData = waterfallBuffer.getChannelData(0);
    for (let i = 0; i < waterfallData.length; i++) {
      waterfallData[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const waterfallSource = ctx.createBufferSource();
    waterfallSource.buffer = waterfallBuffer;
    waterfallSource.loop = true;

    const waterfallFilter = ctx.createBiquadFilter();
    waterfallFilter.type = "bandpass";
    waterfallFilter.frequency.value = 600;
    waterfallFilter.Q.value = 0.5;

    waterfallSource.connect(waterfallFilter);
    waterfallFilter.connect(waterfallGain);
    waterfallSource.start();

    // --- សំឡេងឃ្មុំ (bee buzz) ---
    const beeGain = ctx.createGain();
    beeGain.gain.value = 0;
    beeGain.connect(masterGain);
    sys.beeGain = beeGain;

    const beeOsc = ctx.createOscillator();
    beeOsc.type = "sawtooth";
    beeOsc.frequency.value = 220;
    const beeFilter = ctx.createBiquadFilter();
    beeFilter.type = "lowpass";
    beeFilter.frequency.value = 800;
    beeOsc.connect(beeFilter);
    beeFilter.connect(beeGain);
    beeOsc.start();
    // Modulate frequency for buzz effect
    setInterval(() => {
      if (sys.context && sys.beeGain && sys.beeGain.gain.value > 0.01) {
        beeOsc.frequency.value = 200 + Math.random() * 60;
      }
    }, 100);

    // Chirp loop (តាម setInterval)
    setInterval(() => {
      if (!sys.context || sys.birdGain === null) return;
      if (sys.birdGain.gain.value < 0.01) return;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1500 + Math.random() * 2000;

      oscGain.gain.value = 0.05;
      oscGain.gain.setValueAtTime(0.05, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(oscGain);
      oscGain.connect(birdGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }, 2000 + Math.random() * 3000);
  } catch (err) {
    console.error("Audio init failed:", err);
  }
}

/* Toggle master sound */
export function setMasterVolume(sys: SoundSystem, volume: number): void {
  if (sys.ambientGain) {
    sys.ambientGain.gain.value = volume;
  }
}

/* Toggle rain sound */
export function setRainSound(sys: SoundSystem, on: boolean): void {
  if (sys.rainGain) {
    sys.rainGain.gain.value = on ? 0.4 : 0;
  }
}

/* Toggle bird sound (ម៉ោងថ្ងៃ) */
export function setBirdSound(sys: SoundSystem, on: boolean): void {
  if (sys.birdGain) {
    sys.birdGain.gain.value = on ? 0.5 : 0;
  }
}

/* Toggle wind sound */
export function setWindSound(sys: SoundSystem, on: boolean): void {
  if (sys.windGain) {
    sys.windGain.gain.value = on ? 0.15 : 0;
  }
}

/* Toggle waterfall sound */
export function setWaterfallSound(sys: SoundSystem, on: boolean): void {
  if (sys.waterfallGain) {
    sys.waterfallGain.gain.value = on ? 0.3 : 0;
  }
}

/* Toggle bee sound */
export function setBeeSound(sys: SoundSystem, on: boolean): void {
  if (sys.beeGain) {
    sys.beeGain.gain.value = on ? 0.15 : 0;
  }
}

/* Cleanup */
export function disposeSound(sys: SoundSystem): void {
  if (sys.context) {
    sys.context.close();
    sys.context = null;
    sys.enabled = false;
  }
}
