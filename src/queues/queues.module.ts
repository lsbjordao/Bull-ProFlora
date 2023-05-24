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
  QUEUE_NAME_information,
  Processor_information,
  InjectQueue_information,
} from './information.processor';

import {
  QUEUE_NAME_distribution,
  Processor_distribution,
  InjectQueue_distribution,
} from './distribution.processor';

import {
  QUEUE_NAME_citationFFB,
  Processor_citationFFB,
  InjectQueue_citationFFB,
} from './citationFFB.processor';

import {
  QUEUE_NAME_obraPrinceps,
  Processor_obraPrinceps,
  InjectQueue_obraPrinceps,
} from './obraprinceps.processor';

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

    const queue_information = BullModule.registerQueue({
      name: QUEUE_NAME_information,
    });

    const queue_distribution = BullModule.registerQueue({
      name: QUEUE_NAME_distribution,
    });

    const queue_citationFFB = BullModule.registerQueue({
      name: QUEUE_NAME_citationFFB,
    });

    const queue_obraPrinceps = BullModule.registerQueue({
      name: QUEUE_NAME_obraPrinceps,
    });

    if (
      !queue_oa_mapbiomas_landcover.providers || !queue_oa_mapbiomas_landcover.exports || 
      !queue_records.providers || !queue_records.exports || 
      !queue_information.providers || !queue_information.exports ||
      !queue_distribution.providers || !queue_distribution.exports ||
      !queue_citationFFB.providers || !queue_citationFFB.exports ||
      !queue_obraPrinceps.providers || !queue_obraPrinceps.exports 
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
        queue_information,
        queue_distribution,
        queue_citationFFB,
        queue_obraPrinceps
      ],
      providers: [
        Processor_oa_mapbiomas_landcover, 
        Processor_records, 
        Processor_information, 
        Processor_distribution,
        Processor_citationFFB,
        Processor_obraPrinceps,
        ...queue_oa_mapbiomas_landcover.providers, 
        ...queue_records.providers, 
        ...queue_information.providers,
        ...queue_distribution.providers,
        ...queue_citationFFB.providers,
        ...queue_obraPrinceps.providers
      ],
      exports: [
        ...queue_oa_mapbiomas_landcover.exports, 
        ...queue_records.exports, 
        ...queue_information.exports,
        ...queue_distribution.exports,
        ...queue_citationFFB.exports,
        ...queue_obraPrinceps.exports
      ],
    };
  }

  constructor(
    @InjectQueue_oa_mapbiomas_landcover() private readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_records() private readonly queue_records: Queue,
    @InjectQueue_information() private readonly queue_information: Queue,
    @InjectQueue_distribution() private readonly queue_distribution: Queue,
    @InjectQueue_citationFFB() private readonly queue_citationFFB: Queue,
    @InjectQueue_obraPrinceps() private readonly queue_obraPrinceps: Queue
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(this.queue_information),
        new BullMQAdapter(this.queue_citationFFB),
        new BullMQAdapter(this.queue_obraPrinceps),
        new BullMQAdapter(this.queue_records),
        new BullMQAdapter(this.queue_distribution),
        new BullMQAdapter(this.queue_oa_mapbiomas_landcover)
      ],
      serverAdapter,
    });

    consumer
      .apply(BasicAuthMiddleware, serverAdapter.getRouter())
      .forRoutes('/queues');
  }
}
