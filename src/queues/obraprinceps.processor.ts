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


export const QUEUE_NAME_obraPrinceps = 'Obras princeps';
export const InjectQueue_obraPrinceps = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_obraPrinceps);

@Processor(QUEUE_NAME_obraPrinceps, {
  concurrency: 1,
})
export class Processor_obraPrinceps extends WorkerHost {
  private readonly logger = new Logger(Processor_obraPrinceps.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    const keyPath = './credentials.json';
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets'
    ];
    const credentials = new google.auth.JWT({
      keyFile: keyPath,
      scopes: scopes,
    });
    await credentials.authorize();

    const ss = google.sheets({ version: 'v4', auth: credentials });
    const spreadsheetId = '1vdU2njQ-ZJl4FiDCPpmiX-VrL0637omEyS_hBXQtllY';
    const sheetName = 'Acomp_spp';

    let listOfSpecies: any = await ss.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!E2:E`,
    });
    listOfSpecies = listOfSpecies.data.values.flat();

    let author: any = await ss.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!D2:D`,
    });
    author = author.data.values.flat();

    let speciesAuthor: any;
    const speciesIndex = listOfSpecies.indexOf(species);
    if (speciesIndex !== -1) {
      speciesAuthor = author[speciesIndex];
      const regexPattern = /^(\w+\s+){2}(.*)$/
      speciesAuthor = speciesAuthor.replace(regexPattern, "$2");
    }

    // Tropicos.org

    const TropicosApi = require('@vicentecalfo/tropicos-api-wrapper')
    const tropicosApiKey = require('../../tropicosApiKey.json')

    const tropicosApi = new TropicosApi({
      apiKey: tropicosApiKey[0],
      format: 'json'
    });

    async function searchSpeciesInTropicos() {
      try {
        let taxon = species.replace(/var\. /, '')
        taxon = [...new Set(taxon.split(' '))].join(' ');
        const data = await tropicosApi.search({
          name: taxon,
          type: 'wildcard'
        }).toPromise();

        const myObject = {
          data: data.body
        };
        return myObject;
      } catch (error) {
        console.log(error);
      }
    }

    let tropicosOutput: any = await searchSpeciesInTropicos();


    // IPNI

    const genus = species.match(/^[^\s]+/)[0];
    const epithet = species.match(/^\S+\s+(\S+)/)[1];

    const jskew = require('@vicentecalfo/jskew');

    const ipni = new jskew.Ipni();

    async function searchSpeciesInIpni() {
      let output;
      try {
        const data = await ipni
          .name({
            genus: genus,
            species: epithet,
            author: speciesAuthor,
          })
          .toPromise()
          .then((data: any) => {
            output = data.body.results;
          });

        return output;
      } catch (error) {
        console.log(error);
      }
    }

    const ipniOutput = await searchSpeciesInIpni();

    const output = {
      "Tropicos": JSON.parse(tropicosOutput.data),
      "Ipni": ipniOutput
    }

    const result = output;

    fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/obrasPrinceps/${species}.json`, JSON.stringify(result), 'utf8', (err) => {
      if (err) {
        console.error(err);
      }
    });

    job.updateProgress(100);

    return Promise.resolve(result);
    
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
