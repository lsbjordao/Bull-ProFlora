import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { getOcc } from './helpers/getOccFromOldSys';
import { getOccFromProFlora } from './helpers/getOccFromProFlora';
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
    const source = job.data.source;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    // Start process
    job.updateProgress(1);

    let speciesOcc: any = {};
    let speciesValidationOcc: any = [];
    let speciesValidationSIG: any = [];
    let speciesCoords: any = [];
    let speciesIds: any = [];

    if (source === 'CNCFlora-oldSystem') {
      speciesOcc = await getOcc(species);
      speciesIds = speciesOcc.occIds;
      speciesValidationOcc = speciesOcc.validationRecords;
      speciesValidationSIG = speciesOcc.validationSIG;
      speciesCoords = speciesOcc.coordsObj;
    }

    if (source === 'Museu-Goeldi/PA' || source === 'CNCFlora-ProFlora') {
      speciesOcc = await getOccFromProFlora(species, source);
      if (
        Array.isArray(speciesOcc.validationRecords) &&
        speciesOcc.validationRecords.every(
          (record: any) => record === null
        )
      ) {
        job.log(`All validation records null.`);
        throw new Error('All validation records null.');
      }
      speciesIds = speciesOcc.occIds;

      const occIsValid: any = {
        true: 'Válido',
        false: 'Inválido'
      };
      speciesValidationOcc = speciesOcc.validationRecords;
      speciesValidationOcc = speciesOcc.validationRecords.map((value: any) =>
        occIsValid[value]
      );

      const occStatusGis: any = {
        '0': 'SIG NOT OK',
        '1': 'SIG OK',
        '2': 'SIG NOT OK'
      };
      speciesValidationSIG = speciesOcc.validationSIG.map((value: any) =>
        occStatusGis[value]
      );

      const occGeoreferenceProtocol: any = {
        '1': 'Google Earth',
        '2': 'SIG',
        '3': 'Coletor'
      };
      const occGeoprecision: any = {
        '1': '0 a 250m',
        '2': '250 a 1000m',
        '3': '1 a 5km',
        '4': '5 a 10km',
        '5': '10 a 20 km',
        '6': '50 a 100km',
        '7': 'Centróide de UC',
        '8': 'Centróide de município',
        '9': '20 a 50km'
      };
      speciesCoords = speciesOcc.coordsObj;
      const speciesCoordsIds = speciesOcc.occIds;

      speciesCoords = speciesCoords.map((coord: any, idx: number) => ({
        id: speciesCoordsIds[idx],
        ...coord,
        precision: occGeoprecision[coord.precision?.toString()],
        protocol: occGeoreferenceProtocol[coord.protocol?.toString()]
      }));
    }

    let flowData: any = '';
    let SIGanalyst: any = '';

    if (
      source === 'Museu-Goeldi/PA' ||
      source === 'CNCFlora-ProFlora' ||
      source === 'CNCFlora-oldSystem'
    ) {
      flowData = await whichFlow(species, source);
      SIGanalyst = await getSIGanalyst(species, source);
    }

    // Filter occurrences by flow
    let filteredOccIdx: number[] = [];

    if (flowData.flow === 'PA') {
      for (let i = 0; i < speciesValidationOcc.length; i++) {
        if (
          speciesValidationOcc[i] === 'Válido' &&
          speciesValidationSIG[i] === 'SIG OK'
        ) {
          filteredOccIdx.push(i);
        }
      }
    }

    if (flowData.flow === 'PNA') {
      if (flowData.records === 'x' && flowData.sig === 'x') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (
            speciesValidationOcc[i] === 'Válido' &&
            speciesValidationSIG[i] === 'SIG OK'
          ) {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === 'x' && flowData.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] === 'Válido') {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === '0' && flowData.sig === 'x') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationSIG[i] === 'SIG OK') {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === '0' && flowData.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          filteredOccIdx.push(i);
        }
      }

      if (flowData.records === '!' && flowData.sig === '0') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationOcc[i] !== 'Inválido') {
            filteredOccIdx.push(i);
          }
        }
      }

      if (flowData.records === 'x' && flowData.sig === '!') {
        for (let i = 0; i < speciesValidationOcc.length; i++) {
          if (speciesValidationSIG[i] !== 'SIG NOT') {
            filteredOccIdx.push(i);
          }
        }
      }
    }


    let speciesRecords: any = [];
    filteredOccIdx.forEach((i) => {
      const record = {
        occId: speciesIds[i],
        validationRecord: speciesValidationOcc[i],
        validationSIG: speciesValidationSIG[i],
      };
      const coords = speciesCoords[i];
      const record_coords = Object.assign({}, record, coords);
      speciesRecords.push(record_coords);
    });

    const geojson = new GeoJSON();
    speciesRecords = geojson.parse(speciesRecords, { Point: ['lat', 'lon'] });
    speciesRecords = speciesRecords.features;
    speciesRecords = speciesRecords.filter((obj: any) =>
      obj.geometry.hasOwnProperty('coordinates')
    );

    // Empty coords
    const filteredSpeciesCoords: any[] = [];
    speciesRecords.forEach((coord: any) => {
      if (coord.geometry.coordinates[0] !== '' && coord.geometry.coordinates[1] !== '') {
        filteredSpeciesCoords.push(coord.geometry.coordinates);
      } else {
        job.log(
          `Empty coord: ${coord.geometry.coordinates[0]}, ${coord.geometry.coordinates[1]} (${SIGanalyst}) [id: ${coord.properties.id}]`
        );
      }
    });

    // Trim coords
    filteredSpeciesCoords.forEach((coord: any) => {
      if (typeof coord.lat === 'string') {
        coord.lat = coord.lat.trim();
      }
      if (typeof coord.lon === 'string') {
        coord.lon = coord.lon.trim();
      }
    });

    // Check bad coordinates format
    const regexValidLat = /^-?(90(\.0+)?|[0-8]?\d(\.\d+)?)$/;
    const regexValidLon = /^-?(180(\.0+)?|((1[0-7][0-9]|[1-9]?[0-9])(\.\d*)?))$/;

    const invalidCoordinateFormatCoords: any[] = [];
    speciesRecords.forEach((coord: any) => {
      if (
        !regexValidLat.test(coord.geometry.coordinates[0]) ||
        !regexValidLon.test(coord.geometry.coordinates[1])
      ) {
        invalidCoordinateFormatCoords.push({
          id: coord.properties.id,
          lat: coord.geometry.coordinates[0],
          lon: coord.geometry.coordinates[1]
        });
      }
    });

    if (invalidCoordinateFormatCoords.length > 0) {
      invalidCoordinateFormatCoords.forEach((coord: any) => {
        job.log(
          `Invalid coordinate format: ${coord.lat}, ${coord.lon} (${SIGanalyst}) [id: ${coord.id}]`
        );
      });
      throw new Error('Invalid coordinate format');
    }

    // Check bounding box
    const bbox = {
      minLat: -57.632125,
      maxLat: 23,
      minLon: -102,
      maxLon: -23.339269,
    };

    const coordsOutsideBoundingBox: any[] = [];
    speciesRecords.forEach((coord: any) => {
      const lat = parseFloat(coord.geometry.coordinates[1]);
      const lon = parseFloat(coord.geometry.coordinates[0]);
      if (
        lat < bbox.minLat ||
        lat > bbox.maxLat ||
        lon < bbox.minLon ||
        lon > bbox.maxLon
      ) {
        coordsOutsideBoundingBox.push({
          id: coord.properties.id,
          coords: [coord.geometry.coordinates[0], coord.geometry.coordinates[1]]
        });
      }
    });

    if (coordsOutsideBoundingBox.length > 0) {
      coordsOutsideBoundingBox.forEach((coord: any) => {
        job.log(
          `Coordinates outside bounding box: ${coord.coords} (${SIGanalyst}) [id: ${coord.id}]`
        );
      });
      throw new Error('Coordinates outside bounding box');
    }

    // Coordinates in water
    const worldCountriesPath = './src/queues/geojsons/World_Countries.json';
    let worldCountries: any = readFileSync(worldCountriesPath, 'utf-8');
    worldCountries = JSON.parse(worldCountries);

    const areas = ['South America'];
    let polygons = worldCountries.features
      .filter((feature: any) => areas.indexOf(feature.properties.CONTINENT) !== -1)
      .map((feature: any) => turf.multiPolygon(feature.geometry.coordinates));

    const coordsInWater: any[] = [];
    speciesRecords.forEach((coord: any) => {
      const point = turf.point([Number(coord.geometry.coordinates[1]), Number(coord.geometry.coordinates[0])]);
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
        coordsInWater.push({
          id: coord.properties.id,
          coords: [coord.geometry.coordinates[0], coord.geometry.coordinates[1]]
        });
      }
    });

    if (coordsInWater.length > 0) {
      coordsInWater.forEach((coords: any) => {
        job.log(`Coordinates in water: ${coords.coords} (${SIGanalyst}) [id: ${coords.id}]`);
      });
      throw new Error('Coordinates in water');
    }


    // Write file
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
