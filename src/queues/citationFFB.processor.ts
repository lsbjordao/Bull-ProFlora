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
import * as https from 'https';

export const QUEUE_NAME_citationFFB = 'Citation FFB';
export const InjectQueue_citationFFB = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_citationFFB);

@Processor(QUEUE_NAME_citationFFB, {
  concurrency: 1,
})
export class Processor_citationFFB extends WorkerHost {
  private readonly logger = new Logger(Processor_citationFFB.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    let citation: any;
    let result: any;
    let taxonId: any;
    let listOfSpecies: any;
    let speciesTaxonId: any = null;

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

    listOfSpecies = await ss.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!E2:E`,
    });
    listOfSpecies = listOfSpecies.data.values.flat();

    taxonId = await ss.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!H2:H`,
    });
    taxonId = taxonId.data.values.flat();

    const speciesIndex = listOfSpecies.indexOf(job.data.species);
    if (speciesIndex !== -1) {
      speciesTaxonId = taxonId[speciesIndex];
    }

    async function getCitation(species: any) {
      const options = {
        hostname: 'servicos.jbrj.gov.br',
        path: '/v2/flora/taxon/' + encodeURIComponent(species),
        method: 'GET'
      };
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(JSON.parse(data));
          });
        });
        req.on('error', (error: Error) => {
          reject(error);
        });
        req.end();
      });
    }

    citation = await getCitation(job.data.species);

    if (citation.length === 0) {
      result = { long: 'NÃO_LISTADA_NA_FFB', short: 'COLOCAR_CITAÇÃO' };
    }

    if (citation.length > 0) {
      citation = citation[0].taxon
      let today = new Date();
      const months = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
      ];
      const day = today.getDate();
      const month = months[today.getMonth()];
      const year = today.getFullYear();

      const date = `${day} de ${month} de ${year}`;

      let id = citation.references
      id = id.match(/id\=.*/)[0]
      id = id.replace(/id\=/, '')

      let howToCite = citation.bibliographiccitation_how_to_cite
      let haveAuthor = howToCite.match(/^Flora do Brasil/)
      if (haveAuthor === null) {
        haveAuthor = true
      } else {
        haveAuthor = false
      }
      if (haveAuthor === true) {
        howToCite = howToCite.replace(/(.*)\sin Flora do Brasil.*/, '$1')
        howToCite = howToCite.replace(/\s\w+$/, '')
        howToCite = `${howToCite}, ${year}. Flora e Funga do Brasil. Jardim Botânico do Rio de Janeiro. URL https://floradobrasil.jbrj.gov.br/${id} (acesso em ${date}).`
        citation = howToCite;
      } else {
        citation = `Flora e Funga do Brasil, ${year}. ${citation.family}. Flora e Funga do Brasil. Jardim Botânico do Rio de Janeiro. URL https://floradobrasil.jbrj.gov.br/${id} (acesso em ${date}).`
      }

      function generateShortCitation(longCitation: any) {
        const regex1 = /\b\d{4}\b/;
        const year = longCitation.match(regex1);

        let shortCitation;
        if (longCitation.startsWith('Flora e Funga do Brasil')) {
          shortCitation = 'Flora e Funga do Brasil, ' + year
        } else {
          const authorsRegex = /.*?\d{4}/;
          let authors = longCitation.match(authorsRegex)[0];
          authors = authors.replace(/,?\s*\d{4}\b/, '')
          let authorList = authors.split(/,\s+[\w\.-]+,\s/).filter(Boolean);
          const lastInitialRegex = /,\s[\w\.-]+\s*$/;
          authorList = authorList.map((author: any) => author.replace(lastInitialRegex, ''));

          if (authorList.length === 1) {
            shortCitation = `${authorList[0]}, ${year}`;
          } else if (authorList.length === 2) {
            shortCitation = `${authorList[0]} e ${authorList[1]}, ${year}`;
          } else if (authorList.length > 2) {
            shortCitation = `${authorList[0]} et al., ${year}`;
          }
        }

        return shortCitation;
      }

      const shortCitation = generateShortCitation(citation);

      result = { long: citation, short: shortCitation };
    }

    fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/citationFFB/${job.data.species}.json`, JSON.stringify(result), 'utf8', (err) => {
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
