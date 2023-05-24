import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_records } from './queues/records.processor';
import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_information } from './queues/information.processor';
import { InjectQueue_distribution } from './queues/distribution.processor';
import { InjectQueue_citationFFB } from './queues/citationFFB.processor';
import { InjectQueue_obraPrinceps } from './queues/obraprinceps.processor';
import { InjectQueue_oa_UCs } from './queues/oa_UCs.processor';
import { InjectQueue_oa_TERs } from './queues/oa_TERs.processor';
import { InjectQueue_oa_PANs } from './queues/oa_PANs.processor';
import { InjectQueue_conservationActions } from './queues/conservationActions.processor';
import { InjectQueue_threats } from './queues/threats.processor';
import { InjectQueue_speciesProfile } from './queues/speciesProfile.processor';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue_records() readonly queue_records: Queue,
    @InjectQueue_oa_mapbiomas_landcover() readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_information() readonly queue_information: Queue,
    @InjectQueue_distribution() readonly queue_distribution: Queue,
    @InjectQueue_citationFFB() readonly queue_citationFFB: Queue,
    @InjectQueue_obraPrinceps() readonly queue_obraPrinceps: Queue,
    @InjectQueue_oa_UCs() readonly queue_oa_UCs: Queue,
    @InjectQueue_oa_TERs() readonly queue_oa_TERs: Queue,
    @InjectQueue_oa_PANs() readonly queue_oa_PANs: Queue,
    @InjectQueue_conservationActions() readonly queue_conservationActions: Queue,
    @InjectQueue_threats() readonly queue_threats: Queue,
    @InjectQueue_speciesProfile() readonly queue_speciesProfile: Queue
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
    this.queue_obraPrinceps.add('Obra Princeps', { species });
    return `<i>${species}</i> incluída na fila Obra Princeps`;
  }

  addToQueue_oa_UCs(species: string) {
    this.queue_oa_UCs.add('OA-UCs', { species });
    return `<i>${species}</i> incluída na fila OA-UCs`;
  }

  addToQueue_oa_TERs(species: string) {
    this.queue_oa_TERs.add('OA-UCs', { species });
    return `<i>${species}</i> incluída na fila OA-TERs`;
  }

  addToQueue_oa_PANs(species: string) {
    this.queue_oa_PANs.add('OA-PANs', { species });
    return `<i>${species}</i> incluída na fila OA-PANs`;
  }

  addToQueue_conservationActions(species: string) {
    this.queue_conservationActions.add('Conservation actions', { species });
    return `<i>${species}</i> incluída na fila Conservation actions`;
  }

  addToQueue_threats(species: string) {
    this.queue_threats.add('Threats', { species });
    return `<i>${species}</i> incluída na fila Threats`;
  }

  addToQueue_speciesProfile(species: string) {
    this.queue_speciesProfile.add('Species profile', { species });
    return `<i>${species}</i> incluída na fila Species profile`;
  }

}
