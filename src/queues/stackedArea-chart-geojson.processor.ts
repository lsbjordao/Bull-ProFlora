import {
    Processor,
    WorkerHost,
    OnWorkerEvent,
    InjectQueue,
  } from '@nestjs/bullmq';
  import { Logger } from '@nestjs/common';
  import { Job } from 'bullmq';
  
  import * as fs from 'fs';
  
  import * as chart from './functions/chart';
  
  export const QUEUE_NAME_stackedArea_chart_geojson = 'Stacked-Area-Chart-GeoJSON';
  export const InjectQueue_stackedArea_chart_geojson = (): ParameterDecorator =>
    InjectQueue(QUEUE_NAME_stackedArea_chart_geojson);
  
  @Processor(QUEUE_NAME_stackedArea_chart_geojson, {
    concurrency: 1,
  })
  export class Processor_stackedArea_chart_geojson extends WorkerHost {
    private readonly logger = new Logger(Processor_stackedArea_chart_geojson.name);
  
    async process(job: Job<any, any, string>): Promise<any> {
  
      const feature = job.data.feature;
  
      const pathFile: string = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandCover7/${feature}.json`;
      let file: any = fs.readFileSync(pathFile);
      const data: any = JSON.parse(file);
      
      chart.stackedArea(feature, data.geometry, data.areaKm2);
  
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