// Singleton audio manager — controls background music and hotspot narration
class AudioManager {
  private bgAudio: HTMLAudioElement | null = null;
  private narrationAudio: HTMLAudioElement | null = null;
  private muted = false;

  /** Must be called inside a user gesture to unlock Web Audio on Chrome/Safari */
  unlock() {
    if (this.bgAudio) return;
    this.bgAudio = new Audio();
    this.bgAudio.loop = true;
  }

  setBackgroundTrack(url: string | undefined) {
    if (!this.bgAudio || !url) return;
    if (this.bgAudio.src !== url) {
      this.bgAudio.src = url;
      if (!this.muted) this.bgAudio.play().catch(() => {});
    }
  }

  playNarration(url: string, onEnd?: () => void) {
    this.narrationAudio?.pause();
    if (this.muted) return;

    this.fadeBg(0.2);
    this.narrationAudio = new Audio(url);
    this.narrationAudio.play().catch(() => {});
    this.narrationAudio.onended = () => {
      this.fadeBg(1.0);
      onEnd?.();
    };
  }

  stopNarration() {
    if (this.narrationAudio) {
      this.narrationAudio.pause();
      this.narrationAudio = null;
      this.fadeBg(1.0);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.bgAudio?.pause();
      this.narrationAudio?.pause();
    } else {
      this.bgAudio?.play().catch(() => {});
    }
    return this.muted;
  }

  get isMuted() { return this.muted; }

  private fadeBg(target: number, duration = 500) {
    if (!this.bgAudio) return;
    const start = this.bgAudio.volume;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      this.bgAudio!.volume = start + (target - start) * t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

export const audioManager = new AudioManager();
