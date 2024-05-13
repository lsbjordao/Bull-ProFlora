import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';

import { calculateRates, ICalcRates } from './functions/trendAnalysis';

export const QUEUE_NAME_trendline_calcRates_mapbiomas_landcover = 'Trendline-calcRates-MapBiomas-landcover';
export const InjectQueue_trendline_calcRates_mapbiomas_landcover = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_trendline_calcRates_mapbiomas_landcover);

@Processor(QUEUE_NAME_trendline_calcRates_mapbiomas_landcover, {
  concurrency: 1,
})
export class Processor_trendline_calcRates_mapbiomas_landcover extends WorkerHost {
  private readonly logger = new Logger(Processor_trendline_calcRates_mapbiomas_landcover.name);

  async process(job: Job<any, any, string>): Promise<any> {

    const feature = job.data.feature;

    const pathFile: string = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandCover7/${feature}.json`;
    let file: any = fs.readFileSync(pathFile);
    const data: any = JSON.parse(file);

    const dataIn: ICalcRates = {
      geometry: feature,
      series: data.geometry,
      geometryAreaValue: data.areaKm2
    }

    calculateRates(dataIn);

    return Promise.resolve(true);

  } catch(err: Error) {
    console.error(err);
    return null;
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    const message = `Active #${job.id} - ${job.data.feature}`;
    const blueMessage = `\x1b[34m${message}\x1b[0m`;
    this.logger.log(blueMessage);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.feature}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const message = `Failed #${job.id} - ${job.data.feature}`;
    const redMessage = `\x1b[31m${message}\x1b[0m`;
    this.logger.log(redMessage);
  }
}