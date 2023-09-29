import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import * as _ from 'underscore';
import * as turf from '@turf/turf';

export const QUEUE_NAME_oa_PANs = 'OA-PANs';
export const InjectQueue_oa_PANs = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_oa_PANs);

@Processor(QUEUE_NAME_oa_PANs, {
  concurrency: 1,
})
export class Processor_oa_PANs extends WorkerHost {
  private readonly logger = new Logger(Processor_oa_PANs.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    let records: any = fs.readFileSync(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    let result: any;
    if (records.length === 0) {

      result = [];

      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/oac/PANs/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });

      return Promise.resolve('No records');

    }

    if (records.length > 0) {

      const regexCentroide = /[cC]entr[oó]ide de [Mm]unic[ií]pio/;
      const recordsUtil = records.filter((obj: any) => !regexCentroide.test(obj.properties.precision))

      async function getCoords(records: any) {
        const coords = records.map((feature: any) => {
          return {
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0]
          };
        });

        const coordinates = coords.map(({ lat, lon }: { lat: any, lon: any }) => ({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));

        return coordinates
      }

      const coordinates = await getCoords(recordsUtil);

      let coords;
      coords = coordinates.filter((coord: any) =>
        Object.values(coord).every((val: any) => /^-?\d+(\.\d+)?$/.test(val))
      );

      const PANsFilePath = './src/queues/geojsons/PANs.json';
      let PANs: any = fs.readFileSync(PANsFilePath, 'utf-8');
      PANs = JSON.parse(PANs);

      const polygons: any = PANs.features.map((feature: any) => turf.multiPolygon(feature.geometry.coordinates, feature.properties));

      let PANsPoly: any = [];
      let points: any = [];

      const coordRegex = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,15}/;

      for (let i = 0; i < coords.length; i++) {
        if (coordRegex.test(coords[i].latitude) && coordRegex.test(coords[i].longitude)) {
          const point = turf.point(
            [Number(coords[i].longitude), Number(coords[i].latitude)]
          )
          polygons.forEach((poly: any) => {
            const ptsWithin = turf.pointsWithinPolygon(point, poly)
            if (ptsWithin.features.length > 0) {
              PANsPoly.push(poly)
              points.push(point)
            }
          })
        }
      }

      let onlyPANsName = PANsPoly.map((data: any) => data.properties.PAN)
      onlyPANsName = _.uniq(onlyPANsName)

      const result = onlyPANsName;

      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/oac/PANs/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });

      job.updateProgress(100);

      return Promise.resolve(result);

    }

  } catch(err: Error) {
    console.error(err);
    return null;
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
