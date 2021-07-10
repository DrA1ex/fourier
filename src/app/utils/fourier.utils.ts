export class FourierUtils {
  public static dft(data: number[]): number[] {
    const size = data.length;
    const fourierData = new Array(data.length / 2);
    const const_part = 2 * Math.PI / size;

    for (let freq = 0; freq < size / 2; ++freq) {
      const const_part_with_freq = const_part * freq;
      const freq_amp = data.reduce((acc, value, i) => acc + value * Math.cos(const_part_with_freq * i), 0);
      fourierData[freq] = Math.abs(freq_amp) / size;
    }

    return fourierData;
  }

  public static detectDftPeaks(data: any[]): any[] {
    if (!data) {
      return [];
    }

    const peaks = [];
    let lastValue = data[0];
    let isDataAscending = false;

    for (const item of data) {
      if (item.y >= lastValue.y) {
        lastValue = item;
        isDataAscending = true
      } else if (!isDataAscending) {
        lastValue = item
      } else if (!peaks || peaks[peaks.length - 1] != lastValue) {
        peaks.push(lastValue);
        isDataAscending = false;
      }
    }

    return peaks;
  }
}
