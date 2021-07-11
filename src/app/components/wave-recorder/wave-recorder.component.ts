import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import Chart from "chart.js/auto";
import {DEFAULT_SAMPLE_SIZE, SAMPLE_RATE, SoundUtils} from "../../utils/sound.utils";
import {ChartUtils} from "../../utils/chart.utils";

const RECORD_COUNTDOWN_WAVE = SoundUtils.generateWaveFromFrequencies([220, 440, 880], 2048);
const RECORD_FINISH_WAVE = SoundUtils.generateWaveFromFrequencies([262, 523, 1045], 2048);

@Component({
  selector: 'app-wave-recorder',
  templateUrl: './wave-recorder.component.html',
})
export class WaveRecorderComponent {
  @Output()
  generatedWave = new EventEmitter<number[]>();

  @ViewChild('waveRecorderChart', {static: false})
  chartElement!: ElementRef;

  private audioContext!: AudioContext;
  private sourceChart!: Chart;

  public sourceData: number[] = []

  private initialized: boolean = false;
  private modal: any;

  public state: number = -1;

  constructor(private hostElement: ElementRef) {
  }

  private init(): void {
    if (this.initialized) {
      return;
    }

    // @ts-ignore
    this.modal = new bootstrap.Modal(this.hostElement.nativeElement)
    this.audioContext = new AudioContext({sampleRate: SAMPLE_RATE});
    this.sourceChart = ChartUtils.createDefaultWaveChart(this.chartElement.nativeElement as HTMLCanvasElement);
    this.sourceData = SoundUtils.generateWaveFromFrequencies([220], DEFAULT_SAMPLE_SIZE)

    this.initialized = true;
  }

  public show() {
    this.init();

    this.modal.show();
    this.drawChart();
  }

  public onPlay() {
    SoundUtils.playWave(this.audioContext, this.sourceData);
  }

  public onRecord() {
    this.setRecordState(3);
    setTimeout(() => this.setRecordState(2), 1000);
    setTimeout(() => this.setRecordState(1), 2000);
    setTimeout(() => {
      this.setRecordState(0)
      setTimeout(() => SoundUtils.recordWave(this.audioContext, DEFAULT_SAMPLE_SIZE).then(data => {
        this.sourceData = data;
        this.drawChart();
        this.setRecordState(-1);
      }), 300);
    }, 3000);
  }

  private setRecordState(value: number) {
    this.state = value;
    if (value > 0) {
      SoundUtils.playWave(this.audioContext, RECORD_COUNTDOWN_WAVE);
    } else if (value == 0) {
      SoundUtils.playWave(this.audioContext, RECORD_FINISH_WAVE);
    }
  }

  private drawChart() {
    const step = 1 / SAMPLE_RATE;
    const sourceDataSet: any[] = this.sourceData.map((value, i) => ({
      x: `${(i * step * 1000).toFixed(2)}ms`,
      y: value
    }));

    this.sourceChart.data.datasets = [{
      label: "Wave",
      data: sourceDataSet,
      borderColor: 'rgb(0,0,0)',
      backgroundColor: 'rgb(0,0,0)'
    }];

    setTimeout(() => this.sourceChart?.update(), 0)
  }

  public save() {
    this.generatedWave.emit(this.sourceData);
    this.modal.hide();
  }

}
