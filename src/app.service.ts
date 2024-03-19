import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_records } from './queues/records.processor';
import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_oa_mapbiomas_fire } from './queues/oa_mapbiomas_fire.processor';
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
    @InjectQueue_oa_mapbiomas_fire() readonly queue_oa_mapbiomas_fire: Queue,
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

  addToQueue_records(species: string, source: string, priority?: number) {
    this.queue_records.add('Records', { species, source }, { priority: priority });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Records from ${source} at ${time}`;
  }

  addToQueue_oa_mapbiomas_landcover(species: string) {
    this.queue_oa_mapbiomas_landcover.add('OA-MapBiomas-LandCover', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue OA-MapBiomas-LandCover at ${time}`;
  }

  addToQueue_oa_mapbiomas_fire(species: string) {
    this.queue_oa_mapbiomas_fire.add('OA-MapBiomas-Fire', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue OA-MapBiomas-Fire at ${time}`;
  }

  addToQueue_information(species: string) {
    this.queue_information.add('Information', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Information at ${time}`;
  }

  addToQueue_distribution(species: string) {
    this.queue_distribution.add('Distribution', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Distribution at ${time}`;
  }

  addToQueue_citationFFB(species: string) {
    this.queue_citationFFB.add('Distribution', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Citation FFB at ${time}`;
  }

  addToQueue_obraPrinceps(species: string) {
    this.queue_obraPrinceps.add('Obra Princeps', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Obra Princeps at ${time}`;
  }

  addToQueue_oa_UCs(species: string) {
    this.queue_oa_UCs.add('OA-UCs', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue OA-UCs at ${time}`;
  }

  addToQueue_oa_TERs(species: string) {
    this.queue_oa_TERs.add('OA-UCs', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue OA-TERs at ${time}`;
  }

  addToQueue_oa_PANs(species: string) {
    this.queue_oa_PANs.add('OA-PANs', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue OA-PANs at ${time}`;
  }

  addToQueue_conservationActions(species: string) {
    this.queue_conservationActions.add('Conservation actions', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Conservation actions at ${time}`;
  }

  addToQueue_threats(species: string) {
    this.queue_threats.add('Threats', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Threats at ${time}`;
  }

  addToQueue_speciesProfile(species: string) {
    this.queue_speciesProfile.add('Species profile', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Species profile at ${time}`;
  }

}