import {Component, ViewChild} from '@angular/core';
import Chart from "chart.js/auto";

import {SAMPLE_RATE, SoundUtils} from "./utils/sound.utils";
import {FourierUtils} from "./utils/fourier.utils";
import {WaveSelectorComponent} from "./components/wave-selector/wave-selector.component";

const GENERATE_DATA_CNT = 8192;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public detectedFreqs: number[] = []

  public sourceData: number[] = SoundUtils.generateWaveFromFrequencies(
    [220, 262, 330, 440, 523, 659], GENERATE_DATA_CNT);
  public fourierData: number[] = [];

  private sourceChart?: Chart;
  private resultChart?: Chart;
  private audioContext?: AudioContext;

  @ViewChild('waveSelectorModal')
  waveSelectorModalView!: WaveSelectorComponent;

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

  public playSound(data: number[]) {
    if (!this.audioContext) {
      return
    }

    SoundUtils.playWave(this.audioContext, data);
  }

  public playFreq(freq: number) {
    if (!this.audioContext) {
      return
    }

    const data = SoundUtils.generateWaveFromFrequencies([freq], GENERATE_DATA_CNT)
    SoundUtils.playWave(this.audioContext, data);
  }

  private drawChart() {
    if (!this.sourceChart || !this.resultChart) {
      return;
    }

    const step = 1 / SAMPLE_RATE;
    const sourceDataSet: any[] = this.sourceData.map((value, i) => ({
      x: `${(i * step * 1000).toFixed(2)}ms`,
      y: value
    }));

    this.sourceChart.data.datasets = [{
      label: "Wave",
      data: sourceDataSet,
      borderColor: 'rgb(31,90,128)',
      backgroundColor: 'rgb(31,90,128)'
    }];

    const fourier = FourierUtils.dft(this.sourceData);
    const fourierSet = new Array(fourier.length);
    const freqStep = SAMPLE_RATE / fourier.length / 2;
    for (let i = 0; i < fourier.length; ++i) {
      fourierSet[i] = {
        x: `${(i * freqStep).toFixed(2)}`,
        y: fourier[i]
      };
    }

    const peaks = FourierUtils.detectDftPeaks(fourierSet)
    this.detectedFreqs = peaks.map(f => Math.ceil(f.x));
    this.fourierData = SoundUtils.generateWaveFromFrequencies(this.detectedFreqs, GENERATE_DATA_CNT);

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

  public openWaveSelectorModal() {
    this.waveSelectorModalView.show();
  }

  public updateSourceWave(data: number[]) {
    this.sourceData = data;
    this.drawChart();
  }
}
