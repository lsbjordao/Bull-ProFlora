import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import * as fs from 'fs'
//@ts-ignore
import * as EooAooCalc from '@vicentecalfo/eoo-aoo-calc'

import * as oa from './functions/overlayAnalysis'

export const QUEUE_NAME_oa_mapbiomas_landcover = 'OA-MapBiomas-LandCover'
export const InjectQueue_oa_mapbiomas_landcover = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_oa_mapbiomas_landcover);

@Processor(QUEUE_NAME_oa_mapbiomas_landcover, {
  concurrency: 1,
})
export class Processor_oa_mapbiomas_landcover extends WorkerHost {
  private readonly logger = new Logger(Processor_oa_mapbiomas_landcover.name)

  async process(job: Job<any, any, string>): Promise<any> {

    const species = job.data.species

    if (!species) {
      return Promise.reject(new Error('Failed'))
    }

    job.updateProgress(1)

    const pathFile: string = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`
    let file: any = fs.readFileSync(pathFile);
    let records: any = JSON.parse(file)

    // Exclude records with centroid coordinates
    const regexMunicipio = /[cC]entr[oó]ide de [Mm]unic[ií]pio/;
    const regexEstado = /[cC]entr[oó]ide de [Ee]stado/;
    const recordsUtil = records.filter((obj: any) => !regexMunicipio.test(obj) || !regexEstado.test(obj))

    async function getCoords(geojson: any): Promise<any> {
      const coords = geojson.map((feature: any) => {
        return {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0]
        };
      });

      const coordinates = coords.map(({ lat, lon }: { lat: any, lon: any }) => ({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      }));

      return coordinates;
    }

    const coordinates: any = await getCoords(records);
    const coordinates_for_aooUtil: any = await getCoords(recordsUtil);

    let coords;
    coords = coordinates.filter((coord: any) =>
      Object.values(coord).every((val: any) => /^-?\d+(\.\d+)?$/.test(val))
    );

    let coordsAooUtil;
    coordsAooUtil = coordinates_for_aooUtil.filter((coord: any) =>
      Object.values(coord).every((val: any) => /^-?\d+(\.\d+)?$/.test(val))
    );

    let aooObj;
    let aooArea = 0;
    if (coords.length > 0) {
      const aoo = new EooAooCalc.AOO({ coordinates: coords })
      aooObj = aoo.calculate({ gridWidthInKm: 2 })
      aooArea = aooObj.areaInSquareKm
    }


    let aooUtilObj;
    let aooUtilArea = 0;
    if (coordsAooUtil.length > 0) {
      const aooUtil = new EooAooCalc.AOO({ coordinates: coordsAooUtil })
      aooUtilObj = aooUtil.calculate({ gridWidthInKm: 2 })
      aooUtilArea = aooUtilObj.areaInSquareKm
    }

    let result: any;
    if (coordsAooUtil.length > 0) {
      result = await oa.calcArea(coordsAooUtil)
    } else {
      result = await oa.calcArea(
        [{
          latitude: -26.148915,
          longitude: -41.805632
        }]
      );
    }

    let eooObj;
    let eooArea = 0;
    if (coords.length >= 3) {
      const eoo = new EooAooCalc.EOO({ coordinates: coords })
      eooObj = eoo.calculate()
      eooArea = eooObj.areaInSquareKm
    }

    result.EOO_km2 = eooArea
    result.AOO_km2 = aooArea
    result.AOOutil_km2 = aooUtilArea

    const orderedKeys = ['EOO_km2', 'AOO_km2', 'AOOutil_km2', 'EOO', 'AOO']

    const orderedResult: any = {}

    orderedKeys.forEach(function (key) {
      orderedResult[key] = result[key]
    })
    result = orderedResult

    fs.writeFile(
      `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-landCover7/${job.data.species}.json`,
      JSON.stringify(result), 'utf8', (err) => {
        if (err) {
          console.error(err)
        }
      });

    job.updateProgress(100)

    return Promise.resolve(result)

  } catch(err: Error) {
    console.error(err)
    return null
  }


  @OnWorkerEvent('active')
  onActive(job: Job) {
    const message = `Active #${job.id} - ${job.data.species}`
    const blueMessage = `\x1b[34m${message}\x1b[0m`
    this.logger.log(blueMessage)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.species}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const message = `Failed #${job.id} - ${job.data.species}`
    const redMessage = `\x1b[31m${message}\x1b[0m`
    this.logger.log(redMessage)
  }
}
