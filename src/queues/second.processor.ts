import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const SECOND_QUEUE_NAME = 'second';
export const InjectSecondQueue = (): ParameterDecorator =>
  InjectQueue(SECOND_QUEUE_NAME);

@Processor(SECOND_QUEUE_NAME, {
  concurrency: 3,
})
export class SecondProcessor extends WorkerHost {
  private readonly logger = new Logger(SecondProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    this.logger.log(`Processing ${job.id}`);

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    const out = `${species}`;

    return Promise.resolve({ out });
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
