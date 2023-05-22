import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_records } from './queues/records.processor';
import { InjectSecondQueue } from './queues/second.processor';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue_oa_mapbiomas_landcover() readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_records() readonly queue_records: Queue,
    @InjectSecondQueue() readonly secondQueue: Queue
  ) { }

  addToQueue_oa_mapbiomas_landcover(species: string) {
    this.queue_oa_mapbiomas_landcover.add('OA-MapBiomas-LandCover', { species });
    return `<i>${species}</i> incluída na fila OA-MapBiomas-LandCover`;
  }

  addToQueue_records(species: string) {
    this.queue_records.add('Records', { species });
    return `<i>${species}</i> incluída na fila Records`;
  }

  addToSecondQueue(fail: boolean) {
    this.secondQueue.add('456', { fail });
    return 'OK';
  }

}
