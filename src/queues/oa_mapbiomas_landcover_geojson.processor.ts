import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import * as fs from 'fs'
import * as oa from './functions/overlayAnalysis'

export const QUEUE_NAME_oa_mapbiomas_landcover_geojson = 'OA-MapBiomas-LandCover-Geojson'
export const InjectQueue_oa_mapbiomas_landcover_geojson = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_oa_mapbiomas_landcover_geojson)

@Processor(QUEUE_NAME_oa_mapbiomas_landcover_geojson, {
  concurrency: 1,
})
export class Processor_oa_mapbiomas_landcover_geojson extends WorkerHost {
  private readonly logger = new Logger(Processor_oa_mapbiomas_landcover_geojson.name)

  async process(job: Job<any, any, string>): Promise<any> {
    const geojsonName = job.data.geojson

    if (!geojsonName) {
      return Promise.reject(new Error('Failed'))
    }

    job.updateProgress(1)

    const pathFile: string = `G:/Outros computadores/Meu computador/CNCFlora_data/geojson/${geojsonName}.json`
    const file: any = fs.readFileSync(pathFile)
    const geojson: any = JSON.parse(file)

    const result: any = await oa.calcAreaGeojson(geojson)

    fs.writeFile(
      `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-landCover7/${geojsonName}.json`,
      JSON.stringify(result), 'utf8', (err) => {
        if (err) {
          console.error(err)
        }
      }
    )

    job.updateProgress(100)

    return Promise.resolve(result)
  } catch(err: Error) {
    console.error(err)
    return null
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    const message = `Active #${job.id} - ${job.data.geojson}`
    const blueMessage = `\x1b[34m${message}\x1b[0m`
    this.logger.log(blueMessage)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.geojson}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const message = `Failed #${job.id} - ${job.data.geojson}`
    const redMessage = `\x1b[31m${message}\x1b[0m`
    this.logger.log(redMessage)
  }
}
