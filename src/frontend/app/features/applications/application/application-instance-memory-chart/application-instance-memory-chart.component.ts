import { Component, OnInit, Input } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { FetchApplicationMetricsAction } from '../../../../store/actions/metrics.actions';
import { IMetricMatrixResult } from '../../../../store/types/base-metric.types';

@Component({
  selector: 'app-application-instance-memory-chart',
  templateUrl: './application-instance-memory-chart.component.html',
  styleUrls: ['./application-instance-memory-chart.component.scss']
})
export class ApplicationInstanceMemoryChartComponent implements OnInit {

  @Input('appGuid')
  private appGuid: string;

  @Input('endpointGuid')
  private endpointGuid: string;

  constructor() { }

  private buildChartConfig() {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = 'Memory usage';
    return lineChartConfig;
  }

  public instanceChartConfig = this.buildChartConfig();

  public instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>>

  ngOnInit() {
    this.instanceMetricConfig = {
      getSeriesName: result => `Instance ${result.metric.instance_index}`,
      metricsAction: new FetchApplicationMetricsAction(
        this.appGuid,
        this.endpointGuid,
        'firehose_container_metric_memory_bytes{}[1h]'
      ),
    };
  }
}
