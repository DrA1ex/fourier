export const SAMPLE_RATE = 22050;
export const DEFAULT_SAMPLE_SIZE = 8192;

export class SoundUtils {
  public static playWave(ctx: AudioContext, data: number[]) {
    if (data.length < 0) {
      return;
    }

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

    source.start(ctx.currentTime);
  }

  public static generateWaveFromFrequencies(frequencies: number[], length: number): number[] {
    if (frequencies.length == 0) {
      return []
    }

    const result = new Array(length);
    const step = 1 / SAMPLE_RATE;
    const valuePerStep = 2 * Math.PI;

    for (let i = 0; i < length; ++i) {
      const sinArgCached = i * step * valuePerStep;
      result[i] = frequencies.reduce((acc, f) => acc + Math.sin(sinArgCached * f), 0);
    }

    return result;
  }

  public static async recordWave(ctx: AudioContext, length: number): Promise<number[]> {
    if (!navigator?.mediaDevices?.getUserMedia) {
      return [];
    }

    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    const sourceSampleRate = stream.getAudioTracks()[0].getSettings().sampleRate || SAMPLE_RATE;
    const recorder = new MediaRecorder(stream);

    const bytesToRead = length + sourceSampleRate / 20; // + extra 200ms
    const chunks: Blob[] = [];
    let read = 0;
    let finished = false;

    await new Promise<void>((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        console.log(e.data.size, e.timecode);

        if (finished) {
          return;
        }

        read += e.data.size;
        chunks.push(e.data);

        if (read >= bytesToRead) {
          finished = true
          recorder.stop();
          resolve();
        }
      }

      recorder.start(length / sourceSampleRate); // + extra 200ms
    });

    let written = 0;
    const readBuffer = new Uint8Array(read);
    for (const chunk of chunks) {
      const data = await chunk.arrayBuffer();
      readBuffer.set(new Uint8Array(data), written)
      written += data.byteLength;
    }

    for (const track of stream.getAudioTracks()) {
      track.stop();
    }

    const offset = SAMPLE_RATE / 10; // Skip first 100ms

    const decoded = await ctx.decodeAudioData(readBuffer.buffer);

    const result = Array.from(decoded.getChannelData(0).slice(offset, length + offset));

    const maxValue = result.reduce((acc, cur) => Math.max(acc, Math.abs(cur)), 0);
    return result.map(v => v / maxValue);
  }
}
