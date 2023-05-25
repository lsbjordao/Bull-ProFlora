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

import { writeFile } from 'fs';


export const QUEUE_NAME_records = 'Records';
export const InjectQueue_records = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_records);

@Processor(QUEUE_NAME_records, {
  concurrency: 1,
})
export class Processor_records extends WorkerHost {
  private readonly logger = new Logger(Processor_records.name);

  async process(job: Job<any, any, string>): Promise<any> {

    this.logger.log(`Processing ${job.id}`);

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
    
    /// Bad characters

    /// Coordinates in water


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
    this.logger.log(`Active ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Failed ${job.id}`);
  }
}
