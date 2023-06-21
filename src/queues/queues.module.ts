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
  QUEUE_NAME_oa_mapbiomas_fire,
  Processor_oa_mapbiomas_fire,
  InjectQueue_oa_mapbiomas_fire,
} from './oa_mapbiomas_fire.processor';

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

import {
  QUEUE_NAME_oa_UCs,
  Processor_oa_UCs,
  InjectQueue_oa_UCs,
} from './oa_UCs.processor';

import {
  QUEUE_NAME_oa_TERs,
  Processor_oa_TERs,
  InjectQueue_oa_TERs,
} from './oa_TERs.processor';

import {
  QUEUE_NAME_oa_PANs,
  Processor_oa_PANs,
  InjectQueue_oa_PANs,
} from './oa_PANs.processor';

import {
  QUEUE_NAME_conservationActions,
  Processor_conservationActions,
  InjectQueue_conservationActions,
} from './conservationActions.processor';

import {
  QUEUE_NAME_threats,
  Processor_threats,
  InjectQueue_threats,
} from './threats.processor';

import {
  QUEUE_NAME_speciesProfile,
  Processor_speciesProfile,
  InjectQueue_speciesProfile,
} from './speciesProfile.processor';

import { BasicAuthMiddleware } from './basic-auth.middleware';

@Module({})
export class QueuesModule implements NestModule {
  static register(): DynamicModule {
    const queue_oa_mapbiomas_landcover = BullModule.registerQueue({
      name: QUEUE_NAME_oa_mapbiomas_landcover
    });

    const queue_oa_mapbiomas_fire = BullModule.registerQueue({
      name: QUEUE_NAME_oa_mapbiomas_fire
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

    const queue_oa_UCs = BullModule.registerQueue({
      name: QUEUE_NAME_oa_UCs,
    });

    const queue_oa_TERs = BullModule.registerQueue({
      name: QUEUE_NAME_oa_TERs,
    });

    const queue_oa_PANs = BullModule.registerQueue({
      name: QUEUE_NAME_oa_PANs,
    });

    const queue_conservationActions = BullModule.registerQueue({
      name: QUEUE_NAME_conservationActions,
    });

    const queue_threats = BullModule.registerQueue({
      name: QUEUE_NAME_threats,
    });

    const queue_speciesProfile = BullModule.registerQueue({
      name: QUEUE_NAME_speciesProfile,
    });

    if (
      !queue_oa_mapbiomas_landcover.providers || !queue_oa_mapbiomas_landcover.exports || 
      !queue_oa_mapbiomas_fire.providers || !queue_oa_mapbiomas_fire.exports || 
      !queue_records.providers || !queue_records.exports || 
      !queue_information.providers || !queue_information.exports ||
      !queue_distribution.providers || !queue_distribution.exports ||
      !queue_citationFFB.providers || !queue_citationFFB.exports ||
      !queue_obraPrinceps.providers || !queue_obraPrinceps.exports ||
      !queue_oa_UCs.providers || !queue_oa_UCs.exports ||
      !queue_oa_TERs.providers || !queue_oa_TERs.exports ||
      !queue_oa_PANs.providers || !queue_oa_PANs.exports ||
      !queue_conservationActions.providers || !queue_conservationActions.exports ||
      !queue_threats.providers || !queue_threats.exports ||
      !queue_speciesProfile.providers || !queue_speciesProfile.exports
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
            attempts: 1,
            sizeLimit: 1073741824,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        }),
        queue_oa_mapbiomas_landcover,
        queue_oa_mapbiomas_fire,
        queue_records,
        queue_information,
        queue_distribution,
        queue_citationFFB,
        queue_obraPrinceps,
        queue_oa_UCs,
        queue_oa_TERs,
        queue_oa_PANs,
        queue_conservationActions,
        queue_threats,
        queue_speciesProfile
      ],
      providers: [
        Processor_oa_mapbiomas_landcover, 
        Processor_oa_mapbiomas_fire, 
        Processor_records, 
        Processor_information, 
        Processor_distribution,
        Processor_citationFFB,
        Processor_obraPrinceps,
        Processor_oa_UCs,
        Processor_oa_TERs,
        Processor_oa_PANs,
        Processor_conservationActions,
        Processor_threats,
        Processor_speciesProfile,
        ...queue_oa_mapbiomas_landcover.providers, 
        ...queue_oa_mapbiomas_fire.providers, 
        ...queue_records.providers, 
        ...queue_information.providers,
        ...queue_distribution.providers,
        ...queue_citationFFB.providers,
        ...queue_obraPrinceps.providers,
        ...queue_oa_UCs.providers,
        ...queue_oa_TERs.providers,
        ...queue_oa_PANs.providers,
        ...queue_conservationActions.providers,
        ...queue_threats.providers,
        ...queue_speciesProfile.providers
      ],
      exports: [
        ...queue_oa_mapbiomas_landcover.exports, 
        ...queue_oa_mapbiomas_fire.exports, 
        ...queue_records.exports, 
        ...queue_information.exports,
        ...queue_distribution.exports,
        ...queue_citationFFB.exports,
        ...queue_obraPrinceps.exports,
        ...queue_oa_UCs.exports,
        ...queue_oa_TERs.exports,
        ...queue_oa_PANs.exports,
        ...queue_conservationActions.exports,
        ...queue_threats.exports,
        ...queue_speciesProfile.exports
      ],
    };
  }

  constructor(
    @InjectQueue_oa_mapbiomas_landcover() private readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_oa_mapbiomas_fire() private readonly queue_oa_mapbiomas_fire: Queue,
    @InjectQueue_records() private readonly queue_records: Queue,
    @InjectQueue_information() private readonly queue_information: Queue,
    @InjectQueue_distribution() private readonly queue_distribution: Queue,
    @InjectQueue_citationFFB() private readonly queue_citationFFB: Queue,
    @InjectQueue_obraPrinceps() private readonly queue_obraPrinceps: Queue,
    @InjectQueue_oa_UCs() private readonly queue_oa_UCs: Queue,
    @InjectQueue_oa_TERs() private readonly queue_oa_TERs: Queue,
    @InjectQueue_oa_PANs() private readonly queue_oa_PANs: Queue,
    @InjectQueue_conservationActions() private readonly queue_conservationActions: Queue,
    @InjectQueue_threats() private readonly queue_threats: Queue,
    @InjectQueue_speciesProfile() private readonly queue_speciesProfile: Queue
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
        new BullMQAdapter(this.queue_oa_mapbiomas_landcover),
        new BullMQAdapter(this.queue_oa_mapbiomas_fire),
        new BullMQAdapter(this.queue_oa_UCs),
        new BullMQAdapter(this.queue_oa_TERs),
        new BullMQAdapter(this.queue_oa_PANs),
        new BullMQAdapter(this.queue_conservationActions),
        new BullMQAdapter(this.queue_threats),
        new BullMQAdapter(this.queue_speciesProfile)
      ],
      serverAdapter,
      options: {
        uiConfig: {
          boardTitle: 'Bull-CNCFlora'
        },
      }
    });

    consumer
      .apply(BasicAuthMiddleware, serverAdapter.getRouter())
      .forRoutes('/queues');
  }
}
