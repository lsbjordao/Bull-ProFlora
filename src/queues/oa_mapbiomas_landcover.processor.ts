import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const QUEUE_NAME_oa_mapbiomas_landcover = 'OA-MapBiomas-LandCover';
export const InjectQueue_oa_mapbiomas_landcover = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_oa_mapbiomas_landcover);

@Processor(QUEUE_NAME_oa_mapbiomas_landcover, {
  concurrency: 1,
})
export class Processor_oa_mapbiomas_landcover extends WorkerHost {
  private readonly logger = new Logger(Processor_oa_mapbiomas_landcover.name);

  async process(job: Job<any, any, string>): Promise<any> {

    this.logger.log(`Processing ${job.id}`);

    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    

    const out = `${species}`
    return Promise.resolve({ result: out });
  }


  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Active ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Failed ${job.id}`);
  }
}
