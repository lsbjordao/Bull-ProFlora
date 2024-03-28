import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { getOcc } from './helpers/getOccFromOldSys';
import { getOccFromProFlora } from './helpers/getOccFromProFlora'
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
    let speciesUrns: any = [];
    let speciesValidationOcc: any = [];
    let speciesValidationSIG: any = [];
    let speciesCoords: any = [];
    let speciesIds: any = [];

    if (source === 'CNCFlora-oldSystem') {
      speciesOcc = await getOcc(species);
      speciesUrns = speciesOcc.urns;
      speciesValidationOcc = speciesOcc.validationRecords;
      speciesValidationSIG = speciesOcc.validationSIG;
      speciesCoords = speciesOcc.coordsObj;
      speciesIds = speciesUrns
    }

    if (
      source === 'Museu-Goeldi/PA' ||
      source === 'CNCFlora-ProFlora'
    ) {
      speciesOcc = await getOccFromProFlora(species);

      speciesIds = speciesOcc.ids;

      const occIsValid: any = {
        "true": "Válido",
        "false": "Inválido"
      }
      speciesValidationOcc = speciesOcc.validationRecords;
      speciesValidationOcc = speciesOcc.validationRecords.map((value: any) => occIsValid[value])

      const occStatusGis: any = {
        "0": "SIG NOT OK",
        "1": "SIG OK",
        "2": "SIG NOT OK"
      }
      speciesValidationSIG = speciesOcc.validationSIG.map((value: any) => occStatusGis[value])

      const occGeoreferenceProtocol: any = {
        "1": "Google Earth",
        "2": "SIG",
        "3": "Coletor"
      }
      const occGeoprecision: any = {
        "1": "0 a 250m",
        "2": "250 a 1000m",
        "3": "5 a 10km",
        "4": "50 a 100km",
        "5": "10 a 20 km",
        "6": "50 a 100km",
        "7": "Centróide de UC",
        "8": "Centróide de município"
      }
      speciesCoords = speciesOcc.coordsObj
      speciesCoords = speciesCoords.map((coord: any) => {
        return {
          ...coord,
          precision: occGeoprecision[coord.precision.toString()],
          protocol: occGeoreferenceProtocol[coord.protocol.toString()]
        };
      });
    }

    let flowData: any = ''
    let SIGanalyst: any = ''

    if (source === 'Museu-Goeldi/PA') {
      flowData = await whichFlow(species, 'Museu-Goeldi/PA')
      SIGanalyst = await getSIGanalyst(species, 'Museu-Goeldi/PA')
    }

    if (source === 'CNCFlora-ProFlora') {
      flowData = await whichFlow(species, 'CNCFlora-ProFlora')
      SIGanalyst = await getSIGanalyst(species, 'CNCFlora-ProFlora')
    }

    if (source === 'CNCFlora-oldSystem') {
      flowData = await whichFlow(species, 'CNCFlora-oldSystem')
      SIGanalyst = await getSIGanalyst(species, 'CNCFlora-oldSystem')
    }

    // Empty coords
    // speciesCoords.map((coords: any, idx: number) => {
    //   if (coords.lat === '' || coords.lon === '') {
    //     console.log(idx)
    //     job.log(`Empty coord: ${coords} (${SIGanalyst})`)
    //     throw new Error('Empty latitude or longitude field.')
    //   }
    // })

    // Remoção dos mesmos índices de speciesCoords, speciesUrns, speciesValidationOcc e speciesValidationSIG
    if (flowData.flow === 'PNA' || flowData.flow === 'PA') {
      const indicesToRemove: number[] = [];

      speciesCoords = speciesCoords.filter(
        (coords: { lat: string; lon: string }, index: number) => {
          if (coords.lat === '' || coords.lon === '') {
            indicesToRemove.push(index);
            return false;
          }
          return true;
        },
      );

      indicesToRemove.reverse().forEach((index) => {
        speciesIds.splice(index, 1);
        speciesValidationOcc.splice(index, 1);
        speciesValidationSIG.splice(index, 1);
      });
    }

    // Trim coords
    speciesCoords = speciesCoords.map(
      (coords: { lat: string; lon: string }) => ({
        ...coords,
        lat: coords.lat.trim(),
        lon: coords.lon.trim(),
      }),
    );

    // Check bad coordinates
    job.updateProgress(2);

    /// Coordinates format check
    const regexValidLat = /^-?(90(\.0+)?|[0-8]?\d(\.\d+)?)$/;
    const regexValidLon = /^-?(180(\.0+)?|(\d{1,2}|1[0-7]\d)(\.\d+)?)$/;

    let haveInvalidCoordinateFormat: boolean = false;
    let invalidCoordinateFormatCoords: any[] = [];

    for (let i = 0; i < speciesCoords.length; i++) {
      const isInvalidFormat =
        !regexValidLat.test(speciesCoords[i].lat) ||
        !regexValidLon.test(speciesCoords[i].lon);
      if (isInvalidFormat) {
        invalidCoordinateFormatCoords.push([
          speciesCoords[i].lat,
          speciesCoords[i].lon,
        ]);
        haveInvalidCoordinateFormat = true;
      }
    }

    if (haveInvalidCoordinateFormat) {
      invalidCoordinateFormatCoords.forEach((coords: any) => {
        job.log(`Invalid coordinate format: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Invalid coordinate format');
    }

    /// Check bounding box
    const bbox = {
      minLat: -57.632125,
      maxLat: 23,
      minLon: -102,
      maxLon: -23.339269,
    };

    function isCoordinateInBoundingBox(lat: any, lon: any) {
      return (
        lat >= bbox.minLat &&
        lat <= bbox.maxLat &&
        lon >= bbox.minLon &&
        lon <= bbox.maxLon
      );
    }

    const coordsOutsideBoundingBox = speciesCoords
      .map((coord: any) => {
        const lat = parseFloat(coord.lat);
        const lon = parseFloat(coord.lon);

        if (!isCoordinateInBoundingBox(lat, lon)) {
          return [coord.lat, coord.lon];
        }
      })
      .filter(Boolean);

    if (coordsOutsideBoundingBox.length > 0) {
      coordsOutsideBoundingBox.forEach((coords: any) => {
        job.log(`Coordinates outside bounding box: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Coordinates outside bounding box');
    }

    /// Coordinates in water
    let haveCoordsInWater: boolean = false;
    let coordsInWater: any = [];
    // https://hub.arcgis.com/datasets/CESJ::world-countries/explore?location=-3.705351%2C-31.396331%2C6.00
    const worldCountriesPath = './src/queues/geojsons/World_Countries.json';
    let worldCountries: any = readFileSync(worldCountriesPath, 'utf-8');
    worldCountries = JSON.parse(worldCountries);

    const areas = ['South America'];
    let polygons = worldCountries.features.filter(
      (feature: any) => areas.indexOf(feature.properties.CONTINENT) !== -1,
    );
    polygons = worldCountries.features.map((feature: any) =>
      turf.multiPolygon(feature.geometry.coordinates),
    );

    coordsInWater = speciesCoords
      .map((coord: any) => {
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

        if (
          isInWater &&
          water.reduce((total: any, num: any) => total + num, 0) === 0
        ) {
          return [coord.lat, coord.lon];
        }
        return null;
      })
      .filter(Boolean);

    haveCoordsInWater = coordsInWater.length > 0;

    if (haveCoordsInWater === true) {
      coordsInWater.forEach((coords: any) => {
        job.log(`Coordinates in water: ${coords} (${SIGanalyst})`);
      });
      throw new Error('Coordinates in water');
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
        urn: speciesUrns[i],
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
      obj.geometry.hasOwnProperty('coordinates'),
    );

    writeFile(
      `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`,
      JSON.stringify(speciesRecords),
      'utf8',
      (err) => {
        if (err) {
          console.error(err);
        }
      },
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
