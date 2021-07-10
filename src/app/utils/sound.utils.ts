export const SAMPLE_RATE = 22050;

export class SoundUtils {
  public static playWave(ctx: AudioContext, data: number[]) {
    const buffer = ctx.createBuffer(1, data.length, SAMPLE_RATE);
    const channel = buffer.getChannelData(0);

    let abs_max = 0;
    for (let i = 0; i < data.length; ++i) {
      const value = Math.abs(data[i]);
      if (value > abs_max) {
        abs_max = value;
      }
    }

    for (let i = 0; i < data.length; ++i) {
      channel[i] = data[i] / abs_max;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + data.length / SAMPLE_RATE)

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start();
  }

  public static generateWaveFromFrequencies(frequencies: number[], length: number): number[] {
    const result = new Array(length);
    const step = 1 / SAMPLE_RATE;
    const valuePerStep = 2 * Math.PI;

    for (let i = 0; i < length; ++i) {
      const sinArgCached = i * step * valuePerStep;
      result[i] = frequencies.reduce((acc, f) => acc + Math.sin(sinArgCached * f), 0);
    }

    return result;
  }
}
