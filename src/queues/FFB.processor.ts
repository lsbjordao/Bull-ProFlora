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

export const QUEUE_NAME_FFB = 'FFB';
export const InjectQueue_FFB = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_FFB);

@Processor(QUEUE_NAME_FFB, {
  concurrency: 1,
})
export class Processor_FFB extends WorkerHost {
  private readonly logger = new Logger(Processor_FFB.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    let infraspecificTaxonName = ''
    let hasInfraspecificTaxon = false
    let isSubspecies = false
    let isVariety = false
    if (species.includes('var.') || species.includes('subsp.')) {
      hasInfraspecificTaxon = true
      if (species.includes('var.')) {
        isVariety = true
        infraspecificTaxonName = species.replace('.* var. (.*) ', '%1')
      }
      if (species.includes('subsp.')) {
        isSubspecies = true
        infraspecificTaxonName = species.replace('.* subsp. (.*) ', '%1')
      }
    }
    const speciesName = species.replace(/^(\b\w+\b)(?:\s+([\w-]+))?.*/, '$1 $2').trim();
    
    let citation: any;
    let result: any;

    async function getFromFFB(speciesName: any) {
      const options = {
        hostname: 'servicos.jbrj.gov.br',
        path: '/v2/flora/taxon/' + encodeURIComponent(speciesName),
        method: 'GET',
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => {
            data += chunk;
          });
          res.on('end', () => {
            if (!hasInfraspecificTaxon) {
              const result = JSON.parse(data)
              resolve(result);
            }
            if (hasInfraspecificTaxon) {
              const result = JSON.parse(data)

              if(isVariety === true)
              result.filter((item: any) =>
                item.taxon.taxonrank === "VARIEDADE" &&
                item.taxon.infraspecificepithet === infraspecificTaxonName
              )

              if(isSubspecies === true)
                result.filter((item: any) =>
                  item.taxon.taxonrank === "SUB_ESPECIE" &&
                  item.taxon.infraspecificepithet === infraspecificTaxonName
                )

              resolve(result);
            }
          });
        });
        req.on('error', (error: Error) => {
          // reject(error);
        });
        req.end();
      });
    }

    const response: any = await getFromFFB(speciesName);

    if (response.erro === '500') {
      result = {
        citation: {
          long: 'SERVIDOR_FFB_OFF',
          short: 'COLOCAR_CITAÇÃO',
        },
        endemism: 'NotFoundInFFB'
      }
    }

    if (response.length === 0) {
      result = {
        citation: {
          long: 'NOT_FOUND_IN_FFB',
          short: 'COLOCAR_CITAÇÃO',
        },
        endemism: 'NotFoundInFFB'
      }
    }

    if (response.length > 0) {
      const data = response[0]

      const lifeForm = data.specie_profile?.lifeForm ?? '';
      const habitat = data.specie_profile?.habitat ?? '';
      const vegetationType = data.specie_profile?.vegetationType ?? '';
      let states = []
      if (data.distribuition.locationid) {
        states = data.distribuition.map((item: any) => item.locationid.replace(/BR-/, ''))
      }
      let endemism = data.distribuition[0]?.occurrenceremarks.endemism ?? '';
      if (endemism === 'Endemica') { endemism = 'YES' }
      if (endemism === 'Não endemica') { endemism = 'NO' }
      const phytogeographicDomain = data.distribuition[0]?.occurrenceremarks.phytogeographicDomain ?? [];
      const obraPrinceps = data.taxon.namepublishedin.replace(/([0-9])\s([0-9][0-9][0-9][0-9])/, '$1, $2')
      const vernacularNames = data.vernacular_name.map((item: any) => item)

      const taxonData = data.taxon;

      let today = new Date();
      const months = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ];
      const day = today.getDate();
      const month = months[today.getMonth()];
      const year = today.getFullYear();

      const date = `${day} de ${month} de ${year}`;

      let id = taxonData.references;
      id = id.match(/id\=.*/)[0];
      id = id.replace(/id\=/, '');

      let howToCite = taxonData.bibliographiccitation_how_to_cite;
      let haveAuthor = howToCite.match(/^Flora do Brasil/);
      if (haveAuthor === null) {
        haveAuthor = true;
      } else {
        haveAuthor = false;
      }
      if (haveAuthor === true) {
        const matchResult = howToCite.match(/(\W\w+)\sin/);
        const taxon = matchResult ? matchResult[1] : '';

        howToCite = howToCite.replace(/(.*)\sin Flora do Brasil.*/, '$1');
        howToCite = howToCite.replace(/\s\w+$/, '');
        howToCite = `${howToCite}, ${year}.${taxon}. Flora e Funga do Brasil. Jardim Botânico do Rio de Janeiro. URL https://floradobrasil.jbrj.gov.br/${id} (acesso em ${date}).`;
        citation = howToCite;
      } else {
        citation = `Flora e Funga do Brasil, ${year}. ${taxonData.family}. Flora e Funga do Brasil. Jardim Botânico do Rio de Janeiro. URL https://floradobrasil.jbrj.gov.br/${id} (acesso em ${date}).`;
      }

      function generateShortCitation(longCitation: any) {
        const regex1 = /\b\d{4}\b/;
        const year = longCitation.match(regex1);

        let shortCitation;
        if (longCitation.startsWith('Flora e Funga do Brasil')) {
          shortCitation = 'Flora e Funga do Brasil, ' + year;
        } else {
          const authorsRegex = /.*?\d{4}/;
          let authors = longCitation.match(authorsRegex)[0];
          authors = authors.replace(/,?\s*\d{4}\b/, '');
          let authorList = authors.split(/,\s+[\w\.-]+,\s/).filter(Boolean);
          const lastInitialRegex = /,\s[\w\.-]+\s*$/;
          authorList = authorList.map((author: any) =>
            author.replace(lastInitialRegex, ''),
          );

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

      result = {
        lifeForm, habitat, vegetationType, states, endemism, phytogeographicDomain, obraPrinceps, vernacularNames,
        "citation": { long: citation, short: shortCitation }
      }
    }

    fs.writeFile(
      `G:/Outros computadores/Meu computador/CNCFlora_data/FFB/${job.data.species}.json`,
      JSON.stringify(result),
      'utf8',
      (err) => {
        if (err) {
          console.error(err);
        }
      },
    );

    job.updateProgress(100);

    return Promise.resolve(result);
  }
  catch(err: Error) {
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
