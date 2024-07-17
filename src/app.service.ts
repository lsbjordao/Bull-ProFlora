import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_records } from './queues/records.processor';
import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_oa_mapbiomas_fire } from './queues/oa_mapbiomas_fire.processor';
import { InjectQueue_oa_mapbiomas_landcover_geojson } from './queues/oa_mapbiomas_landcover_geojson.processor';
import { InjectQueue_information } from './queues/information.processor';
import { InjectQueue_distribution } from './queues/distribution.processor';
import { InjectQueue_FFB } from './queues/FFB.processor';
import { InjectQueue_obraPrinceps } from './queues/obraprinceps.processor';
import { InjectQueue_oa_UCs } from './queues/oa_UCs.processor';
import { InjectQueue_oa_TERs } from './queues/oa_TERs.processor';
import { InjectQueue_oa_PANs } from './queues/oa_PANs.processor';
import { InjectQueue_conservationActions } from './queues/conservationActions.processor';
import { InjectQueue_threats } from './queues/threats.processor';
import { InjectQueue_speciesProfile } from './queues/speciesProfile.processor';
import { InjectQueue_stackedArea_chart_geojson } from './queues/stackedArea-chart-geojson.processor';
import { InjectQueue_trendline_chart_mapbiomas_landcover } from './queues/trendline_chart_mapbiomas_landcover.processor';
import { InjectQueue_trendline_calcRates_mapbiomas_landcover } from './queues/trendline_calcRates_mapbiomas_landcover.processor';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue_records() readonly queue_records: Queue,
    @InjectQueue_oa_mapbiomas_landcover() readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_oa_mapbiomas_fire() readonly queue_oa_mapbiomas_fire: Queue,
    @InjectQueue_oa_mapbiomas_landcover_geojson() readonly queue_oa_mapbiomas_landcover_geojson: Queue,
    @InjectQueue_information() readonly queue_information: Queue,
    @InjectQueue_distribution() readonly queue_distribution: Queue,
    @InjectQueue_FFB() readonly queue_FFB: Queue,
    @InjectQueue_obraPrinceps() readonly queue_obraPrinceps: Queue,
    @InjectQueue_oa_UCs() readonly queue_oa_UCs: Queue,
    @InjectQueue_oa_TERs() readonly queue_oa_TERs: Queue,
    @InjectQueue_oa_PANs() readonly queue_oa_PANs: Queue,
    @InjectQueue_conservationActions() readonly queue_conservationActions: Queue,
    @InjectQueue_threats() readonly queue_threats: Queue,
    @InjectQueue_speciesProfile() readonly queue_speciesProfile: Queue,
    @InjectQueue_stackedArea_chart_geojson() readonly queue_stackedAreaChartGeojson: Queue,
    @InjectQueue_trendline_chart_mapbiomas_landcover() readonly queue_trendline_chart_mapbiomas_landcover: Queue,
    @InjectQueue_trendline_calcRates_mapbiomas_landcover() readonly queue_trendline_calcRates_mapbiomas_landcover: Queue
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

  addToQueue_oa_mapbiomas_landcover_geojson(geojson: string) {
    this.queue_oa_mapbiomas_landcover_geojson.add('OA-MapBiomas-LandCover-Geojson', { geojson });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${geojson} included on queue OA-MapBiomas-LandCover-Geojson at ${time}`;
  }

  addToQueue_information(species: string, source: string) {
    this.queue_information.add('Information', { species, source });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Information from ${source} at ${time}`;
  }

  addToQueue_distribution(species: string, source: string) {
    this.queue_distribution.add('Distribution', { species, source });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Distribution at ${time}`;
  }

  addToQueue_FFB(species: string) {
    this.queue_FFB.add('Distribution', { species });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue FFB at ${time}`;
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

  addToQueue_conservationActions(species: string, source: string) {
    this.queue_conservationActions.add('Conservation actions', { species, source });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${species} included on queue Conservation actions from ${source} at ${time}`;
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

  addToQueue_stackedArea_chart_geojson(feature: string) {
    this.queue_stackedAreaChartGeojson.add('Stacked-Area-Chart-GeoJSON', { feature });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${feature} included on queue Stacked-Area-Chart-GeoJSON at ${time}`;
  }

  addToQueue_trendline_chart_mapbiomas_landcover(feature: string) {
    this.queue_trendline_chart_mapbiomas_landcover.add('Trendline-chart-MapBiomas-landcover', { feature });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${feature} included on queue Trendline-chart-MapBiomas-landcover at ${time}`;
  }

  addToQueue_trendline_calcRates_mapbiomas_landcover(feature: string) {
    this.queue_trendline_calcRates_mapbiomas_landcover.add('Trendline-calcRates-MapBiomas-landcover', { feature });
    const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    return `${feature} included on queue Trendline-calcRates-MapBiomas-landcover at ${time}`;
  }

}