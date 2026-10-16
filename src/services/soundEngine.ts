import { AlarmSoundType } from '../types';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: number | null = null;
  private currentVolume: number = 0.8;
  private currentSoundType: AlarmSoundType = 'urgent';

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
  }

  public setSoundType(type: AlarmSoundType) {
    this.currentSoundType = type;
  }

  // Play a single beep or cycle based on sound type
  private playCycle(type: AlarmSoundType) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'urgent': {
        // High pitch urgent double-burst beep
        const freqs = [880, 1174];
        freqs.forEach((freq, idx) => {
          const osc = this.audioCtx!.createOscillator();
          const gain = this.audioCtx!.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(this.currentVolume * 0.7, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);

          osc.connect(gain);
          gain.connect(this.audioCtx!.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.11);
        });
        break;
      }

      case 'siren': {
        // European police / emergency ambulance oscillating siren
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.35);
        osc.frequency.linearRampToValueAtTime(650, now + 0.7);

        gain.gain.setValueAtTime(this.currentVolume * 0.75, now);
        gain.gain.setValueAtTime(this.currentVolume * 0.75, now + 0.65);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.7);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.72);
        break;
      }

      case 'bell': {
        // Metallic alarm bell with multiple harmonics
        const baseFreq = 780;
        const harmonics = [1, 1.48, 2.05, 2.76];
        harmonics.forEach((h, i) => {
          const osc = this.audioCtx!.createOscillator();
          const gain = this.audioCtx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * h, now);

          const decay = 0.45 / (i + 1);
          gain.gain.setValueAtTime(this.currentVolume * 0.5 * (1 / (i + 1)), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

          osc.connect(gain);
          gain.connect(this.audioCtx!.destination);

          osc.start(now);
          osc.stop(now + decay);
        });
        break;
      }

      case 'sonar': {
        // Submarine warning radar sonar ping
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

        gain.gain.setValueAtTime(this.currentVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.62);
        break;
      }
    }
  }

  // Trigger vibration if supported on Android
  private triggerVibration() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
      } catch {
        // Ignore if blocked
      }
    }
  }

  public startAlarm(soundType?: AlarmSoundType, volume?: number, enableVibrate: boolean = true) {
    if (this.isPlaying) return;
    this.initContext();

    if (soundType) this.currentSoundType = soundType;
    if (volume !== undefined) this.setVolume(volume);

    this.isPlaying = true;

    // Immediately play first tone
    this.playCycle(this.currentSoundType);
    if (enableVibrate) this.triggerVibration();

    // Repeat every 0.85s
    const period = this.currentSoundType === 'siren' ? 800 : this.currentSoundType === 'sonar' ? 900 : 700;
    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.playCycle(this.currentSoundType);
      if (enableVibrate) this.triggerVibration();
    }, period);
  }

  public stopAlarm() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  // Preview sound for 2 seconds in settings
  public previewSound(soundType: AlarmSoundType, volume: number = 0.8) {
    this.initContext();
    this.setVolume(volume);
    this.playCycle(soundType);

    // Play second beep for realistic taste
    setTimeout(() => {
      this.playCycle(soundType);
    }, 600);
  }
}

export const soundEngine = new SoundEngine();
