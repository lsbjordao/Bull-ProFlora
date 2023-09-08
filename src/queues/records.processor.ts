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
import { getSIGanalyst } from './helpers/getSIGanalyst';

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
    const SIGanalyst = await getSIGanalyst(species);

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

    if (haveBadCoords === true) {
      badCoords.forEach((coords: any) => {
        job.log(`Bad characters: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Bad characters');
    };

    // Coordinates format check
    const regexValidLat = /^-?(90(\.0+)?|[0-8]?\d(\.\d+)?)$/;
    const regexValidLon = /^-?(180(\.0+)?|(\d{1,2}|1[0-7]\d)(\.\d+)?)$/;

    let haveInvalidCoordinateFormat: boolean = false;
    let invalidCoordinateFormatCoords: any[] = [];

    for (let i = 0; i < speciesCoords.length; i++) {
      const isInvalidFormat = !regexValidLat.test(speciesCoords[i].lat) || !regexValidLon.test(speciesCoords[i].lon);
      if (isInvalidFormat) {
        invalidCoordinateFormatCoords.push([speciesCoords[i].lat, speciesCoords[i].lon]);
        haveInvalidCoordinateFormat = true;
      }
    }

    if (haveInvalidCoordinateFormat) {
      invalidCoordinateFormatCoords.forEach((coords: any) => {
        job.log(`Invalid coordinate format: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Invalid coordinate format');
    }

    /// Coordinates in water
    let haveCoordsInWater: boolean = false;
    let coordsInWater: any = [];
    // https://hub.arcgis.com/datasets/CESJ::world-countries/explore?location=-3.705351%2C-31.396331%2C6.00
    const worldCountriesPath = './src/queues/geojsons/World_Countries.json';
    let worldCountries: any = readFileSync(worldCountriesPath, 'utf-8');
    worldCountries = JSON.parse(worldCountries);

    const areas = ['South America']
    let polygons = worldCountries.features.filter((feature: any) => areas.indexOf(feature.properties.CONTINENT) !== -1)
    polygons = worldCountries.features.map((feature: any) => turf.multiPolygon(feature.geometry.coordinates));

    coordsInWater = speciesCoords.map((coord: any) => {
      const point = turf.point([Number(coord.lon), Number(coord.lat)]);
      let water: any = [];
    
      const isInWater = polygons.some((poly: any) => {
        const ptsWithin = turf.booleanPointInPolygon(point, poly);
        if (ptsWithin) {
          water.push(1);
        } else {
          water.push(0);
        }
    
        return ptsWithin;
      });
    
      if (isInWater && water.reduce((total: any, num: any) => total + num, 0) === 0) {
        return [coord.lat, coord.lon];
      }
      return null;
    }).filter(Boolean);

    haveCoordsInWater = coordsInWater.length > 0;


    if (haveCoordsInWater === true) {
      coordsInWater.forEach((coords: any) => {
        job.log(`Coordinates in water: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Coordinates in water');
    };


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
      if (flowData.records === 'x' && flowData.sig === 'x') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] === "Válido" && speciesValidationSIG[i] === "SIG OK") {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === 'x' && flowData.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] === "Válido") {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === '0' && flowData.sig === 'x') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationSIG[i] === "SIG OK") {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === '0' && flowData.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          filteredOccIdx.push(i);
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
    const message = `Active #${job.id} - ${job.data.species}`;
    const blueMessage = `\x1b[34m${message}\x1b[0m`;
    this.logger.log(blueMessage);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.species}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const message = `Failed #${job.id} - ${job.data.species}`;
    const redMessage = `\x1b[31m${message}\x1b[0m`;
    this.logger.log(redMessage);
  }
}
