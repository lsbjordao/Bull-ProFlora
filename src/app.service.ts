import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { InjectQueue_records, QUEUE_NAME_records } from './queues/records.processor';
import { InjectQueue_oa_mapbiomas_landcover } from './queues/oa_mapbiomas_landcover.processor';
import { InjectQueue_information } from './queues/information.processor';
import { InjectQueue_distribution } from './queues/distribution.processor';
import { InjectQueue_citationFFB } from './queues/citationFFB.processor';
import { InjectQueue_obraPrinceps } from './queues/obraprinceps.processor';
import { InjectQueue_oa_UCs } from './queues/oa_UCs.processor';
import { InjectQueue_oa_TERs } from './queues/oa_TERs.processor';
import { InjectQueue_oa_PANs } from './queues/oa_PANs.processor';
import { InjectQueue_conservationActions } from './queues/conservationActions.processor';
import { InjectQueue_threats } from './queues/threats.processor';
import { InjectQueue_speciesProfile } from './queues/speciesProfile.processor';

import { existsSync } from 'fs';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

import { hasFile } from './queues/helpers/getOccFromOldSys';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue_records() readonly queue_records: Queue,
    @InjectQueue_oa_mapbiomas_landcover() readonly queue_oa_mapbiomas_landcover: Queue,
    @InjectQueue_information() readonly queue_information: Queue,
    @InjectQueue_distribution() readonly queue_distribution: Queue,
    @InjectQueue_citationFFB() readonly queue_citationFFB: Queue,
    @InjectQueue_obraPrinceps() readonly queue_obraPrinceps: Queue,
    @InjectQueue_oa_UCs() readonly queue_oa_UCs: Queue,
    @InjectQueue_oa_TERs() readonly queue_oa_TERs: Queue,
    @InjectQueue_oa_PANs() readonly queue_oa_PANs: Queue,
    @InjectQueue_conservationActions() readonly queue_conservationActions: Queue,
    @InjectQueue_threats() readonly queue_threats: Queue,
    @InjectQueue_speciesProfile() readonly queue_speciesProfile: Queue
  ) { }

  addToQueue_records(species: string) {
    this.queue_records.add('Records', { species });
    return `<i>${species}</i> incluída na fila Records`;
  }

  addToQueue_oa_mapbiomas_landcover(species: string) {
    this.queue_oa_mapbiomas_landcover.add('OA-MapBiomas-LandCover', { species });
    return `<i>${species}</i> incluída na fila OA-MapBiomas-LandCover`;
  }

  addToQueue_information(species: string) {
    this.queue_information.add('Information', { species });
    return `<i>${species}</i> incluída na fila Information`;
  }

  addToQueue_distribution(species: string) {
    this.queue_distribution.add('Distribution', { species });
    return `<i>${species}</i> incluída na fila Distribution`;
  }

  addToQueue_citationFFB(species: string) {
    this.queue_citationFFB.add('Distribution', { species });
    return `<i>${species}</i> incluída na fila Citation FFB`;
  }

  addToQueue_obraPrinceps(species: string) {
    this.queue_obraPrinceps.add('Obra Princeps', { species });
    return `<i>${species}</i> incluída na fila Obra Princeps`;
  }

  addToQueue_oa_UCs(species: string) {
    this.queue_oa_UCs.add('OA-UCs', { species });
    return `<i>${species}</i> incluída na fila OA-UCs`;
  }

  addToQueue_oa_TERs(species: string) {
    this.queue_oa_TERs.add('OA-UCs', { species });
    return `<i>${species}</i> incluída na fila OA-TERs`;
  }

  addToQueue_oa_PANs(species: string) {
    this.queue_oa_PANs.add('OA-PANs', { species });
    return `<i>${species}</i> incluída na fila OA-PANs`;
  }

  addToQueue_conservationActions(species: string) {
    this.queue_conservationActions.add('Conservation actions', { species });
    return `<i>${species}</i> incluída na fila Conservation actions`;
  }

  addToQueue_threats(species: string) {
    this.queue_threats.add('Threats', { species });
    return `<i>${species}</i> incluída na fila Threats`;
  }

  addToQueue_speciesProfile(species: string) {
    this.queue_speciesProfile.add('Species profile', { species });
    return `<i>${species}</i> incluída na fila Species profile`;
  }

  // add Jobs

  // async addJobs() {
  //   (async () => {
  //     console.log('agagagagaga')
  //     // Get list of species from follow-up table
  //     const keyPath = './credentials.json';
  //     const scopes = [
  //       'https://www.googleapis.com/auth/spreadsheets'
  //     ];
  //     const credentials = new google.auth.JWT({
  //       keyFile: keyPath,
  //       scopes: scopes,
  //     });
  //     await credentials.authorize();

  //     const ss = google.sheets({ version: 'v4', auth: credentials });
  //     const spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
  //     const sheetName = 'List_for_HTML_profile';

  //     ss.spreadsheets.values.get({
  //       spreadsheetId: spreadsheetId,
  //       range: `${sheetName}!E2:E`,
  //     }, (err: Error, res: any) => {
  //       if (err) {
  //         console.error('Erro ao obter os valores da coluna E:', err);
  //         return;
  //       }
  //       const species = res.data.values;

  //       async function speciesWithFile() {
  //         const existingFile = [];

  //         for (let i = 0; i < species.length; i++) {
  //           const input = species[i];
  //           const exists = await hasFile(input);
  //           if (exists) {
  //             existingFile.push(input);
  //           }
  //         }
  //         return existingFile;
  //       }

  //       // Add jobs in Records
  //       speciesWithFile().then((result) => {
  //         let species = result;
  //         species = species.flat()

  //         this.queue_records.getJobs().then(async (jobs: any) => {

  //           const jobNames = jobs.map(function (job: any) {
  //             return job.data.species;
  //           });
    
  //           const speciesToAdd = species
  //           .map(function (value) {
  //             return value.toString();
  //           })
  //           .filter(function (value) {
  //             const path = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${value}.html`;
  //             return !jobNames.includes(value) && existsSync(path);
  //           });

  //           speciesToAdd.forEach((species: string) => {
  //             this.addToQueue_records(species);
  //           });
    
  //         });

  //       });

  //       // Add jobs in OA-MapBiomas-LandCover

  //     });

  //   })();
  // }

}