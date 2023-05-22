import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import {
  QUEUE_NAME_oa_mapbiomas_landcover,
  Processor_oa_mapbiomas_landcover,
  InjectQueue_oa_mapbiomas_landcover,
} from './oa_mapbiomas_landcover.processor';

import {
  QUEUE_NAME_records,
  Processor_records,
  InjectQueue_records
} from './records.processor';

import {
  SECOND_QUEUE_NAME,
  SecondProcessor,
  InjectSecondQueue,
} from './second.processor';

import { BasicAuthMiddleware } from './basic-auth.middleware';

@Module({})
export class QueuesModule implements NestModule {
  static register(): DynamicModule {
    const queue_oa_mapbiomas_landcover = BullModule.registerQueue({
      name: QUEUE_NAME_oa_mapbiomas_landcover
    });

    const queue_records = BullModule.registerQueue({
      name: QUEUE_NAME_records,
    });

    const secondQueue = BullModule.registerQueue({
      name: SECOND_QUEUE_NAME,
    });

    if (
      !queue_oa_mapbiomas_landcover.providers || !queue_oa_mapbiomas_landcover.exports || 
      !queue_records.providers || !queue_records.exports || 
      !secondQueue.providers || !secondQueue.exports
    ) {
      throw new Error('Unable to build queue');
    }

    return {
      module: QueuesModule,
      imports: [
        BullModule.forRoot({
          connection: {
            host: 'localhost',
            port: 6379,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        }),
        queue_oa_mapbiomas_landcover,
        queue_records,
        secondQueue,
      ],
      providers: [
        Processor_oa_mapbiomas_landcover, 
        Processor_records, 
        SecondProcessor, 
        ...queue_oa_mapbiomas_landcover.providers, 
        ...queue_records.providers, 
        ...secondQueue.providers
      ],
      exports: [
        ...queue_oa_mapbiomas_landcover.exports, 
        ...queue_records.exports, 
        ...secondQueue.exports
      ],
    };
  }

  constructor(
    @InjectQueue_oa_mapbiomas_landcover() private readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_records() private readonly queue_records: Queue,
    @InjectSecondQueue() private readonly secondQueue: Queue,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(this.queue_oa_mapbiomas_landcover),
        new BullMQAdapter(this.queue_records),
        new BullMQAdapter(this.secondQueue)
      ],
      serverAdapter,
    });

    consumer
      .apply(BasicAuthMiddleware, serverAdapter.getRouter())
      .forRoutes('/queues');
  }
}
