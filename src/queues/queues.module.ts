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
  QUEUE_NAME_oa_mapbiomas_landcover_geojson,
  Processor_oa_mapbiomas_landcover_geojson,
  InjectQueue_oa_mapbiomas_landcover_geojson,
} from './oa_mapbiomas_landcover_geojson.processor';

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
  QUEUE_NAME_FFB,
  Processor_FFB,
  InjectQueue_FFB,
} from './FFB.processor';

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

import {
  QUEUE_NAME_stackedArea_chart_geojson,
  Processor_stackedArea_chart_geojson,
  InjectQueue_stackedArea_chart_geojson,
} from './stackedArea-chart-geojson.processor';

import {
  QUEUE_NAME_trendline_chart_mapbiomas_landcover,
  Processor_trendline_chart_mapbiomas_landcover,
  InjectQueue_trendline_chart_mapbiomas_landcover,
} from './trendline_chart_mapbiomas_landcover.processor';

import {
  QUEUE_NAME_trendline_calcRates_mapbiomas_landcover,
  Processor_trendline_calcRates_mapbiomas_landcover,
  InjectQueue_trendline_calcRates_mapbiomas_landcover,
} from './trendline_calcRates_mapbiomas_landcover.processor';

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

    const queue_oa_mapbiomas_landcover_geojson = BullModule.registerQueue({
      name: QUEUE_NAME_oa_mapbiomas_landcover_geojson
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

    const queue_FFB = BullModule.registerQueue({
      name: QUEUE_NAME_FFB,
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

    const queue_stackedAreaChartGeojson = BullModule.registerQueue({
      name: QUEUE_NAME_stackedArea_chart_geojson,
    });

    const queue_trendline_chart_mapbiomas_landcover = BullModule.registerQueue({
      name: QUEUE_NAME_trendline_chart_mapbiomas_landcover,
    });

    const queue_trendline_calcRates_mapbiomas_landcover = BullModule.registerQueue({
      name: QUEUE_NAME_trendline_calcRates_mapbiomas_landcover,
    });
    

    if (
      !queue_oa_mapbiomas_landcover.providers || !queue_oa_mapbiomas_landcover.exports || 
      !queue_oa_mapbiomas_fire.providers || !queue_oa_mapbiomas_fire.exports || 
      !queue_oa_mapbiomas_landcover_geojson.providers || !queue_oa_mapbiomas_landcover_geojson.exports || 
      !queue_records.providers || !queue_records.exports || 
      !queue_information.providers || !queue_information.exports ||
      !queue_distribution.providers || !queue_distribution.exports ||
      !queue_FFB.providers || !queue_FFB.exports ||
      !queue_obraPrinceps.providers || !queue_obraPrinceps.exports ||
      !queue_oa_UCs.providers || !queue_oa_UCs.exports ||
      !queue_oa_TERs.providers || !queue_oa_TERs.exports ||
      !queue_oa_PANs.providers || !queue_oa_PANs.exports ||
      !queue_conservationActions.providers || !queue_conservationActions.exports ||
      !queue_threats.providers || !queue_threats.exports ||
      !queue_speciesProfile.providers || !queue_speciesProfile.exports ||
      !queue_stackedAreaChartGeojson.providers || !queue_stackedAreaChartGeojson.exports ||
      !queue_trendline_chart_mapbiomas_landcover.providers || !queue_trendline_chart_mapbiomas_landcover.exports ||
      !queue_trendline_calcRates_mapbiomas_landcover.providers || !queue_trendline_calcRates_mapbiomas_landcover.exports

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
        queue_oa_mapbiomas_landcover_geojson,
        queue_records,
        queue_information,
        queue_distribution,
        queue_FFB,
        queue_obraPrinceps,
        queue_oa_UCs,
        queue_oa_TERs,
        queue_oa_PANs,
        queue_conservationActions,
        queue_threats,
        queue_speciesProfile,
        queue_stackedAreaChartGeojson,
        queue_trendline_chart_mapbiomas_landcover,
        queue_trendline_calcRates_mapbiomas_landcover
      ],
      providers: [
        Processor_oa_mapbiomas_landcover, 
        Processor_oa_mapbiomas_fire, 
        Processor_oa_mapbiomas_landcover_geojson, 
        Processor_records, 
        Processor_information, 
        Processor_distribution,
        Processor_FFB,
        Processor_obraPrinceps,
        Processor_oa_UCs,
        Processor_oa_TERs,
        Processor_oa_PANs,
        Processor_conservationActions,
        Processor_threats,
        Processor_speciesProfile,
        Processor_stackedArea_chart_geojson,
        Processor_trendline_chart_mapbiomas_landcover,
        Processor_trendline_calcRates_mapbiomas_landcover,
        ...queue_oa_mapbiomas_landcover.providers, 
        ...queue_oa_mapbiomas_fire.providers, 
        ...queue_oa_mapbiomas_landcover_geojson.providers, 
        ...queue_records.providers, 
        ...queue_information.providers,
        ...queue_distribution.providers,
        ...queue_FFB.providers,
        ...queue_obraPrinceps.providers,
        ...queue_oa_UCs.providers,
        ...queue_oa_TERs.providers,
        ...queue_oa_PANs.providers,
        ...queue_conservationActions.providers,
        ...queue_threats.providers,
        ...queue_speciesProfile.providers,
        ...queue_stackedAreaChartGeojson.providers,
        ...queue_trendline_chart_mapbiomas_landcover.providers,
        ...queue_trendline_calcRates_mapbiomas_landcover.providers
      ],
      exports: [
        ...queue_oa_mapbiomas_landcover.exports, 
        ...queue_oa_mapbiomas_fire.exports, 
        ...queue_oa_mapbiomas_landcover_geojson.exports, 
        ...queue_records.exports, 
        ...queue_information.exports,
        ...queue_distribution.exports,
        ...queue_FFB.exports,
        ...queue_obraPrinceps.exports,
        ...queue_oa_UCs.exports,
        ...queue_oa_TERs.exports,
        ...queue_oa_PANs.exports,
        ...queue_conservationActions.exports,
        ...queue_threats.exports,
        ...queue_speciesProfile.exports,
        ...queue_stackedAreaChartGeojson.exports,
        ...queue_trendline_chart_mapbiomas_landcover.exports,
        ...queue_trendline_calcRates_mapbiomas_landcover.exports
      ],
    };
  }

  constructor(
    @InjectQueue_oa_mapbiomas_landcover() private readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_oa_mapbiomas_fire() private readonly queue_oa_mapbiomas_fire: Queue,
    @InjectQueue_oa_mapbiomas_landcover_geojson() private readonly queue_oa_mapbiomas_landcover_geojson: Queue,
    @InjectQueue_records() private readonly queue_records: Queue,
    @InjectQueue_information() private readonly queue_information: Queue,
    @InjectQueue_distribution() private readonly queue_distribution: Queue,
    @InjectQueue_FFB() private readonly queue_FFB: Queue,
    @InjectQueue_obraPrinceps() private readonly queue_obraPrinceps: Queue,
    @InjectQueue_oa_UCs() private readonly queue_oa_UCs: Queue,
    @InjectQueue_oa_TERs() private readonly queue_oa_TERs: Queue,
    @InjectQueue_oa_PANs() private readonly queue_oa_PANs: Queue,
    @InjectQueue_conservationActions() private readonly queue_conservationActions: Queue,
    @InjectQueue_threats() private readonly queue_threats: Queue,
    @InjectQueue_speciesProfile() private readonly queue_speciesProfile: Queue,
    @InjectQueue_stackedArea_chart_geojson() private readonly queue_stackedAreaChartGeojson: Queue,
    @InjectQueue_trendline_chart_mapbiomas_landcover() private readonly queue_trendline_chart_mapbiomas_landcover: Queue,
    @InjectQueue_trendline_calcRates_mapbiomas_landcover() private readonly queue_trendline_calcRates_mapbiomas_landcover: Queue
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(this.queue_information),
        new BullMQAdapter(this.queue_FFB),
        new BullMQAdapter(this.queue_obraPrinceps),
        new BullMQAdapter(this.queue_records),
        new BullMQAdapter(this.queue_distribution),
        new BullMQAdapter(this.queue_oa_mapbiomas_landcover),
        new BullMQAdapter(this.queue_oa_mapbiomas_fire),
        new BullMQAdapter(this.queue_oa_mapbiomas_landcover_geojson),
        new BullMQAdapter(this.queue_oa_UCs),
        new BullMQAdapter(this.queue_oa_TERs),
        new BullMQAdapter(this.queue_oa_PANs),
        new BullMQAdapter(this.queue_conservationActions),
        new BullMQAdapter(this.queue_threats),
        new BullMQAdapter(this.queue_speciesProfile),
        new BullMQAdapter(this.queue_stackedAreaChartGeojson),
        new BullMQAdapter(this.queue_trendline_chart_mapbiomas_landcover),
        new BullMQAdapter(this.queue_trendline_calcRates_mapbiomas_landcover)
      ],
      serverAdapter,
      options: {
        uiConfig: {
          boardTitle: 'ProFlora-Bull'
        },
      }
    });

    consumer
      .apply(BasicAuthMiddleware, serverAdapter.getRouter())
      .forRoutes('/queues');
  }
}
