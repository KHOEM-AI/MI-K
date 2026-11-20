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
  enabled: boolean;
}

export function createSoundSystem(): SoundSystem {
  return {
    context: null,
    ambientGain: null,
    rainGain: null,
    windGain: null,
    birdGain: null,
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

/* Cleanup */
export function disposeSound(sys: SoundSystem): void {
  if (sys.context) {
    sys.context.close();
    sys.context = null;
    sys.enabled = false;
  }
}
