export class OceanSoundManager {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private isPlaying = false;

  public toggle(): boolean {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (this.isPlaying) {
      this.gain?.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => {
        this.source?.stop();
        this.source = null;
      }, 1000);
      this.isPlaying = false;
      return false;
    } else {
      this.playOcean();
      this.isPlaying = true;
      return true;
    }
  }

  private playOcean() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 2);

    this.source.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.source.start();
  }
}
