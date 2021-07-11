import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import Chart from "chart.js/auto";
import {RandomUtils} from "../../utils/random.utils";
import {SAMPLE_RATE, SoundUtils} from "../../utils/sound.utils";
import {ChartUtils} from "../../utils/chart.utils";

const POINTS_CNT = 8192;

const CHART_COLORS = [
  'rgb(255, 99, 132)',
  'rgb(255, 159, 64)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(54, 162, 235)',
  'rgb(153, 102, 255)',
  'rgb(201, 203, 207)'
]

const PREDEFINED_WAVES = [
  [220, 262, 330],
  [440, 523, 659],
  [262, 330, 392],
  [523, 659, 784]
];

@Component({
  selector: 'app-wave-selector',
  templateUrl: './wave-selector.component.html'
})
export class WaveSelectorComponent {
  @Output()
  generatedWave = new EventEmitter<number[]>();

  @ViewChild('waveSelectorSourceChart', {static: false})
  chartElement!: ElementRef;

  private audioContext?: AudioContext;
  private sourceChart?: Chart;

  public sourceData: number[] = []
  public freqs: number[] = [];

  private initialized: boolean = false;
  private modal: any;

  constructor(private hostElement: ElementRef) {
  }

  init(): void {
    if (this.initialized) {
      return;
    }

    // @ts-ignore
    this.modal = new bootstrap.Modal(this.hostElement.nativeElement)
    this.audioContext = new AudioContext();
    this.sourceChart = ChartUtils.createDefaultWaveChart(this.chartElement.nativeElement as HTMLCanvasElement);

    this.initialized = true;
  }

  public show() {
    this.init();

    this.modal.show();
    this.freqs = RandomUtils.randomChoice(PREDEFINED_WAVES).concat([]);
    this.drawChart();
  }

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

  public onPlay() {
    if (this.audioContext) {
      SoundUtils.playWave(this.audioContext, this.sourceData);
    }
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

  private drawChart() {
    if (!this.sourceChart) {
      return;
    }

    const [resultSet, sets] = this.generateSourceData();
    this.sourceData = resultSet.map(v => v.y);
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

    setTimeout(() => this.sourceChart?.update(), 0)
  }

  public save() {
    this.generatedWave.emit(this.sourceData);
    this.modal.hide();
  }
}
