import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_records } from './queues/records.processor';
import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_information } from './queues/information.processor';
import { InjectQueue_distribution } from './queues/distribution.processor';
import { InjectQueue_citationFFB } from './queues/citationFFB.processor';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue_records() readonly queue_records: Queue,
    @InjectQueue_oa_mapbiomas_landcover() readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_information() readonly queue_information: Queue,
    @InjectQueue_distribution() readonly queue_distribution: Queue,
    @InjectQueue_citationFFB() readonly queue_citationFFB: Queue
  ) { }

  addToQueue_records(species: string) {
    this.queue_records.add('Records', { species });
    return `<i>${species}</i> incluída na fila Records`;
  }

  addToQueue_oa_mapbiomas_landcover(species: string) {
    this.queue_oa_mapbiomas_landcover.add('OA-MapBiomas-LandCover', { species });
    return `<i>${species}</i> incluída na fila OA-MapBiomas-LandCover`;
  }

  addToQueue_information(species: string) {
    this.queue_information.add('Information', { species });
    return `<i>${species}</i> incluída na fila Information`;
  }

  addToQueue_distribution(species: string) {
    this.queue_distribution.add('Distribution', { species });
    return `<i>${species}</i> incluída na fila Distribution`;
  }

  addToQueue_citationFFB(species: string) {
    this.queue_citationFFB.add('Distribution', { species });
    return `<i>${species}</i> incluída na fila Citation FFB`;
  }

  addToQueue_obraPrinceps(species: string) {
    this.queue_citationFFB.add('Obra Princeps', { species });
    return `<i>${species}</i> incluída na fila Obra Princeps`;
  }

}
