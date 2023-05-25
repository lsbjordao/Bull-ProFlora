import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { getOcc } from './helpers/getOccFromOldSys';
import { whichFlow } from './helpers/whichFlow';
import { GeoJSON } from './helpers/geojson';

import { writeFile, readFileSync } from 'fs';
import * as turf from '@turf/turf';

export const QUEUE_NAME_records = 'Records';
export const InjectQueue_records = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_records);

@Processor(QUEUE_NAME_records, {
  concurrency: 1,
})
export class Processor_records extends WorkerHost {
  private readonly logger = new Logger(Processor_records.name);

  async process(job: Job<any, any, string>): Promise<any> {

    this.logger.log(`Processing #${job.id} - ${job.data.species}`);

    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    // Start process
    job.updateProgress(1);

    const speciesOcc: any = await getOcc(species);
    const speciesUrns = speciesOcc.urns;
    const speciesValidationOcc = speciesOcc.validationRecords;
    const speciesValidationSIG = speciesOcc.validationSIG;
    const speciesCoords = speciesOcc.coordsObj;
    const flowData = await whichFlow(species);

    // Check bad coordinates
    job.updateProgress(2);

    /// Bad characters
    const regexBadcharacters = /[º°,]|--/;

    let haveBadCoords: boolean = false;
    let badCoords: any = [];
    for (let i = 0; i < speciesCoords.length; i++) {
      if (regexBadcharacters.test(speciesCoords[i].lat) || regexBadcharacters.test(speciesCoords[i].lon)) {
        badCoords.push([speciesCoords[i].lat, speciesCoords[i].lon])
        haveBadCoords = true
      }
    }

    /// Coordinates in water
    const regexCoordsInWater = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,15}/;

    let haveCoordsInWater: boolean = false;
    let coordsInWater = [];
    // https://hub.arcgis.com/datasets/CESJ::world-countries/explore?location=-3.705351%2C-31.396331%2C6.00
    const worldCountriesPath = './src/queues/geojsons/World_Countries.json';
    let worldCountries: any = readFileSync(worldCountriesPath, 'utf-8');
    worldCountries = JSON.parse(worldCountries);
    
    const areas = ['South America']
    let polygons = worldCountries.features.filter((feature: any) => areas.indexOf(feature.properties.CONTINENT) !== -1)
    polygons = worldCountries.features.map((feature: any) => turf.multiPolygon(feature.geometry.coordinates));
    for (let i = 0; i < speciesCoords.length; i++) {
      if (regexCoordsInWater.test(speciesCoords[i].lat) && regexCoordsInWater.test(speciesCoords[i].lon)) {
        const point = turf.point(
          [Number(speciesCoords[i].lon), Number(speciesCoords[i].lat)]
        )
        let water: any = []
        polygons.forEach((poly: any) => {
          const ptsWithin = turf.booleanPointInPolygon(point, poly)
          if (ptsWithin) {
            water.push(1)
          } else {
            water.push(0)
          }
        })
        water = water.reduce((total: any, num: any) => total + num, 0) === 0
        if (water) {
          coordsInWater.push([speciesCoords[i].lat, speciesCoords[i].lon])
          haveCoordsInWater = true
        }
      }
    }

    if (haveBadCoords === true || haveCoordsInWater === true) {

      if (haveBadCoords === true && haveCoordsInWater === true) {
        const log: any = {
          BadCoordinates: badCoords,
          CoordinatesInWater: coordsInWater
        };
        job.log(log);

        throw new Error('Bad characters & Coordinates in water');
      };

      if (haveBadCoords === true && haveCoordsInWater === false) {
        const log: any = {
          BadCoordinates: badCoords,
        };
        job.log(log);

        throw new Error('Bad characters');
      };

      if (haveBadCoords === false && haveCoordsInWater === true) {
        const log: any = {
          CoordinatesInWater: coordsInWater
        };
        job.log(log);

        throw new Error('Coordinates in water');
      };

    }


    // Filter occurrences by flow
    let filteredOccIdx: number[] = [];
    if (flowData.flow === 'PA') {

      for (let i = 0; i < speciesValidationOcc.length; i++) {
        if (speciesValidationOcc[i] === "Válido" && speciesValidationSIG[i] === "SIG OK") {
          filteredOccIdx.push(i);
        }
      }

    }
    if (flowData.flow === 'PNA') {

      if (flowData.records === 'x' && speciesValidationOcc.sig === 'x') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] === "Válido" && speciesValidationSIG[i] === "SIG OK") {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === 'x' && speciesValidationOcc.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] === "Válido") {
            filteredOccIdx.push(i);
          }
        }
      }

    }

    let speciesRecords: any = [];
    filteredOccIdx.forEach(i => {
      const record = {
        urn: speciesUrns[i],
        validationRecord: speciesValidationOcc[i],
        validationSIG: speciesValidationSIG[i]
      };
      const coords = speciesCoords[i];
      const record_coords = Object.assign({}, record, coords);
      speciesRecords.push(record_coords);
    });

    const geojson = new GeoJSON();
    speciesRecords = geojson.parse(speciesRecords, { Point: ['lat', 'lon'] });
    speciesRecords = speciesRecords.features

    writeFile(
      `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`,
      JSON.stringify(speciesRecords),
      'utf8',
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );

    job.updateProgress(100);

    return Promise.resolve({ speciesRecords });

  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Active #${job.id} - ${job.data.species}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.species}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Failed #${job.id} - ${job.data.species}`);
  }
}
