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
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

export const QUEUE_NAME_information = 'Information';
export const InjectQueue_information = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_information);

@Processor(QUEUE_NAME_information, {
  concurrency: 1,
})
export class Processor_information extends WorkerHost {
  private readonly logger = new Logger(Processor_information.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const { species, source } = job.data;

    if (!species || !source) {
      return Promise.reject(new Error('Failed: species or source missing.'));
    }

    job.updateProgress(1);

    const keyPath = './credentials.json';
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
    ];

    const credentials = new google.auth.JWT({
      keyFile: keyPath,
      scopes: scopes,
    });

    await credentials.authorize();

    const sheets = google.sheets({ version: 'v4', auth: credentials });

    // Definindo o ID da planilha de acordo com a fonte
    const spreadsheetId = this.getSpreadsheetId(source);
    const sheetName = 'Acomp_spp';

    try {
      const speciesData: any = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!E2:T`,
      });

      const speciesIndex = speciesData.data.values.findIndex((row: any) => row[0] === species);

      if (speciesIndex === -1) {
        throw new Error(`Species ${species} not found in spreadsheet.`);
      }

      const speciesRow = speciesData.data.values[speciesIndex];
      const result = this.extractSpeciesData(speciesRow);

      await this.saveSpeciesData(species, result);

      job.updateProgress(100);
      return Promise.resolve(result);

    } catch (err) {
      console.error(err);
      job.updateProgress(100); // Atualiza progresso mesmo em erro
      return Promise.reject(err);
    }
  }

  private getSpreadsheetId(source: string): string {
    switch (source) {
      case 'CNCFlora-oldSystem':
        return process.env.SPREADSHEET_ID_CNCFLORA_OLD || '';
      case 'CNCFlora-ProFlora':
        return process.env.SPREADSHEET_ID_CNCFLORA_PROFLORA || '';
      case 'Museu-Goeldi/PA':
        return process.env.SPREADSHEET_ID_MUSEU_GOELDI || '';
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  private extractSpeciesData(speciesRow: any[]): any {
    return {
      vernacularNames: speciesRow[4],
      endemism: speciesRow[5],
      occurrenceRemarks: speciesRow[6],
      location: speciesRow[7],
      lifeForm: speciesRow[8],
      vegetationType: speciesRow[9],
      habitat: speciesRow[10],
      cites: speciesRow[12],
      uses: speciesRow[14],
      IUCN_assessment_presence: speciesRow[15] || "",
    };
  }

  private saveSpeciesData(species: string, result: any): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/information/${species}.json`, JSON.stringify(result), 'utf8', (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
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
    this.logger.log(`Failed #${job.id} - ${job.data.species}`, true);
  }
}
