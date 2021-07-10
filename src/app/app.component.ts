import {Component} from '@angular/core';
import Chart from "chart.js/auto";

const POINTS_CNT = 4096;
const SAMPLE_RATE = 22050;


const CHART_COLORS = [
  'rgb(255, 99, 132)',
  'rgb(255, 159, 64)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(54, 162, 235)',
  'rgb(153, 102, 255)',
  'rgb(201, 203, 207)'
]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public freqs: number[] = [220, 262, 330, 440, 523, 659]
  public detectedFreqs: number[] = []

  private sourceChart?: Chart;
  private resultChart?: Chart;
  private audioContext?: AudioContext;

  public onRemove(freq: number) {
    const index = this.freqs.indexOf(freq);
    this.freqs.splice(index, 1);

    this.drawChart();
  }

  public onAdd(freqStr?: string) {
    const freq = freqStr && Number.parseInt(freqStr);
    if (!freq || freq < 0) {
      return
    }

    const index = this.freqs.indexOf(freq);
    if (index < 0) {
      this.freqs.push(freq);
    }

    this.drawChart();
  }

  private ngOnInit() {
    this.audioContext = new AudioContext();

    this.sourceChart = new Chart(document.getElementById('sourceChart') as HTMLCanvasElement, {
      type: 'line',
      data: {datasets: []},
      options: {
        elements: {
          line: {
            borderWidth: 2,
          },
          point: {
            radius: 0
          }
        },
        animation: false,
        spanGaps: true,
        normalized: true,
        plugins: {decimation: {enabled: true}},
      }
    });
    this.resultChart = new Chart(document.getElementById('resultChart') as HTMLCanvasElement, {
      type: 'line',
      data: {datasets: []},
      options: {
        elements: {
          line: {
            borderWidth: 2,
          },
          point: {
            radius: 0
          }
        },
        scales: {
          x: {
            display: true,
            type: 'logarithmic'
          },
          y: {
            display: true,
          }
        },
        animation: false,
        spanGaps: true,
        normalized: true,
        plugins: {decimation: {enabled: true}},
      }
    });

    this.drawChart();
  }

  private generateSourceData(): [any[], any[]] {
    if (this.freqs.length == 0) {
      return [[], []];
    }

    const resultSet = new Array(POINTS_CNT);
    const sets = new Array(this.freqs.length);
    for (let i = 0; i < sets.length; ++i) {
      sets[i] = new Array(POINTS_CNT);
    }

    const step = 1 / SAMPLE_RATE;
    const valuePerStep = 2 * Math.PI;

    for (let i = 0; i < POINTS_CNT; ++i) {
      const xLabel = `${(i * step * 1000).toFixed(2)}ms`;

      let sumValue = 0;
      for (let freqIndex = 0; freqIndex < this.freqs.length; ++freqIndex) {
        const yValue = Math.sin(i * step * valuePerStep * this.freqs[freqIndex]);
        sumValue += yValue;
        sets[freqIndex][i] = {x: xLabel, y: yValue}
      }

      resultSet[i] = {
        x: xLabel,
        y: sumValue
      }
    }

    return [resultSet, sets];
  }

  public playSound(freqs: number[]) {
    if (!this.audioContext) {
      return
    }

    const gain = this.audioContext.createGain();

    const time = this.audioContext.currentTime
    for (let i = 0; i < freqs.length; ++i) {
      const osc = this.audioContext.createOscillator()
      osc.type = "sine";
      osc.frequency.value = freqs[i];

      osc.connect(gain);
      osc.start(time);
      osc.stop(time + 1);
    }

    gain.gain.value = 0.5 / freqs.length;
    gain.gain.linearRampToValueAtTime(0.01, time + 1);
    gain.connect(this.audioContext.destination);
  }

  private drawChart() {
    if (!this.sourceChart || !this.resultChart) {
      return;
    }

    const [resultSet, sets] = this.generateSourceData();
    const otherDatasets = this.freqs.map((f, i) => {
      return {
        label: `freq. ${f}`,
        data: sets[i],
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderDash: [5, 5]
      }
    });

    this.sourceChart.data.datasets = [{
      label: "Wave",
      data: resultSet,
      borderColor: 'rgb(0,0,0)',
      backgroundColor: 'rgb(0,0,0)'
    }, ...otherDatasets];

    const fourier = AppComponent.calcDFT(resultSet.map(v => v.y));
    const fourierSet = new Array(fourier.length);
    for (let i = 0; i < fourier.length; ++i) {
      fourierSet[i] = {
        x: `${(i * SAMPLE_RATE / POINTS_CNT).toFixed(2)}`,
        y: fourier[i]
      };
    }

    const peaks = AppComponent.detectPeaks(fourierSet)
    this.detectedFreqs = peaks.map(f => Math.ceil(f.x));

    this.resultChart.data.datasets = [{
      label: "Fourier",
      data: fourierSet,
      borderColor: 'rgb(24,44,76)',
      backgroundColor: 'rgb(24,44,76)'
    }, {
      type: "scatter",
      label: "Peaks",
      data: peaks,
      borderColor: 'rgb(76,24,24)',
      backgroundColor: 'rgb(76,24,24)',
      pointStyle: "rectRot",
      pointRadius: 3
    }];


    setTimeout(() => {
      if (this.sourceChart)
        this.sourceChart.update();
      if (this.resultChart)
        this.resultChart.update();
    }, 0)
  }

  private static calcDFT(data: number[]): number[] {
    const size = data.length;
    const fourierData = new Array(POINTS_CNT / 2);
    const const_part = 2 * Math.PI / size;

    for (let freq = 0; freq < size / 2; ++freq) {
      const const_part_with_freq = const_part * freq;
      const freq_amp = data.reduce((acc, value, i) => acc + value * Math.cos(const_part_with_freq * i), 0);
      fourierData[freq] = Math.abs(freq_amp) / size;
    }

    return fourierData;
  }

  private static detectPeaks(data: any[]): any[] {
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
