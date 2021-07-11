import Chart from "chart.js/auto";

export class ChartUtils {
  public static createDefaultWaveChart(nativeElement: HTMLCanvasElement, options: any = {}): Chart {
    const config: any = Object.assign({}, {
      type: 'line',
      data: Object.assign({}, {datasets: []}),
      options: Object.assign({}, {
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
      }, options)
    });

    return new Chart(nativeElement as HTMLCanvasElement, config);
  }
}
