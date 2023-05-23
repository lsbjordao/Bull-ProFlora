import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import { google } from 'googleapis';

export const QUEUE_NAME_information = 'Information';
export const InjectQueue_information = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_information);

@Processor(QUEUE_NAME_information, {
  concurrency: 1,
})
export class Processor_information extends WorkerHost {
  private readonly logger = new Logger(Processor_information.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    this.logger.log(`Processing ${job.id}`);

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    try {
      const keyPath = './credentials.json';
      const scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
      ];
      const credentials = new google.auth.JWT({
        keyFile: keyPath,
        scopes: scopes,
      });
      await credentials.authorize();

      const sheets = google.sheets({ version: 'v4', auth: credentials });
      const spreadsheetId = '1vdU2njQ-ZJl4FiDCPpmiX-VrL0637omEyS_hBXQtllY';
      const sheetName = 'Acomp_spp';

      const speciesData: any = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!E2:T`,
      });
      const speciesIndex = speciesData.data.values.findIndex((row: any) => row[0] === job.data.species);

      const speciesRow = speciesData.data.values[speciesIndex];
      const speciesVernacularNames = speciesRow[4];
      const speciesEndemism = speciesRow[5];
      const speciesOccurrenceRemarks = speciesRow[6];
      const speciesLocation = speciesRow[7];
      const speciesLifeForm = speciesRow[8];
      const speciesVegetationType = speciesRow[9];
      const speciesHabitat = speciesRow[10];
      const speciesCites = speciesRow[12];
      const speciesUses = speciesRow[14];
      const speciesIUCN_assessment_presence = speciesRow[15];

      const result = {
        "vernacularNames": speciesVernacularNames,
        "endemism": speciesEndemism,
        "occurrenceRemarks": speciesOccurrenceRemarks,
        "location": speciesLocation,
        "lifeForm": speciesLifeForm,
        "vegetationType": speciesVegetationType,
        "habitat": speciesHabitat,
        "cites": speciesCites,
        "uses": speciesUses,
        "IUCN_assessment_presence": speciesIUCN_assessment_presence,
      };

      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/information/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });

      return Promise.resolve(result);
    } catch (err) {
      console.error(err);
      return null;
    }

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
