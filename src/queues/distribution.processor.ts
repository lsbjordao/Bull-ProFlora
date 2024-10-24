import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';

import { getOcc } from './helpers/getOccFromOldSys';
import { getOccFromProFlora } from './helpers/getOccFromProFlora';
//@ts-ignore
import * as admDivisions from './functions/admDivisions';
import * as _ from 'underscore';

export const QUEUE_NAME_distribution = 'Distribution';
export const InjectQueue_distribution = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_distribution);

@Processor(QUEUE_NAME_distribution, {
  concurrency: 1,
})
export class Processor_distribution extends WorkerHost {
  private readonly logger = new Logger(Processor_distribution.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species
    const source = job.data.source
    const datasetName = job.data.datasetName;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1)

    let speciesOcc: any = {};
    let speciesOccIds: any = [];
    let speciesStates: any = [];
    let speciesMunicipalities: any = [];

    if (source === 'CNCFlora-oldSystem') {
      speciesOcc = await getOcc(species);
      speciesStates = speciesOcc.states;
      speciesMunicipalities = speciesOcc.municipalities;
      speciesOccIds = speciesOcc.occIds
    }

    if (
      source === 'Museu-Goeldi/PA' ||
      source === 'CNCFlora-ProFlora'
    ) {
      speciesOcc = await getOccFromProFlora(species, datasetName, source);
      speciesOccIds = speciesOcc.occIds
      speciesStates = speciesOcc.states
      speciesMunicipalities = speciesOcc.municipalities
    }
    
    job.updateProgress(2)

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    const FFBFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/FFB/${job.data.species}.json`;

    let records: any = await fs.promises.readFile(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    const recordsOccIds = records.map((element: any) => element.properties.occId);

    job.updateProgress(3)

    let FFBdata: any = await fs.promises.readFile(FFBFilePath, 'utf-8');
    
    FFBdata = JSON.parse(FFBdata);
    let endemism = FFBdata.endemism;
    if (endemism === 'YES') { endemism = true };
    if (endemism === 'NO') { endemism = false };
    
    job.updateProgress(4)

    let result: any = [];

    for (let i = 0; i < speciesStates.length; i++) {
      if (recordsOccIds.includes(speciesOccIds[i])) {
        const obj = {
          firstLvl: speciesStates[i],
          secondLvl: speciesMunicipalities[i]
        };
        result.push(obj);
      }
    }

    result = _.filter(result, function (item: any) {
      return item.firstLvl !== '' && item.firstLvl !== undefined
    });

    result = _.filter(result, function (item: any) {
      return item.secondLvl !== '' && item.secondLvl !== undefined && item.secondLvl !== null
    });
    
    result = _.uniq(result, false, function (item: any) {
      return JSON.stringify(item);
    });

    const distribution: any = result.map((obj: any) => {
      const { firstLvl, secondLvl } = obj;
      const bestMatch = admDivisions.getBestMatch(firstLvl, secondLvl);
      bestMatch.firstLvl_search = firstLvl;
      bestMatch.secondLvl_search = secondLvl;
      return bestMatch;
    });

    function generateDistributionText(distribution: any) {
      const countries: any = [];
      const municipalities: any = {};

      distribution.forEach(({ country, firstLvl, secondLvl }: { country: any, firstLvl: any, secondLvl: any }) => {
        const key = `${country}|${firstLvl}|${secondLvl}`;
        if (!municipalities[key]) {
          municipalities[key] = { country, firstLvl, secondLvl };
          if (!countries.includes(country)) {
            countries.push(country);
          }
        }
      });

      let text = '';
      if (countries.length > 1) {
        if (countries.includes('Brasil')) {
          countries.splice(countries.indexOf('Brasil'), 1);
          countries.unshift('Brasil');
        } else {
          // Nossa base possui registros fora do Brasil
          if (endemism === true) {
            text += 'A espécie é considerada endêmica do Brasil (citação FFB); no entanto, encontramos registros fora do Brasil em nossa base de dados.';
          }
          if (endemism === false) {
            text += 'A espécie não é endêmica do Brasil (citação FFB).';
          }
          if (endemism === 'NotFoundInFFB') {
            text += 'A espécie é ou não é endêmica do Brasil (COLOCAR_CITAÇÃO).';
          }
        }
      } else if (countries.length === 1 && countries[0] === 'Brasil') {
        // Nossa base possui registros apenas do Brasil
        if (endemism === true) {
          text += 'A espécie é endêmica do Brasil (citação FFB), com distribuição.';
        }
        if (endemism === false) {
          text += 'Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil (citação FFB); no entanto, não registramos ocorrências fora desse país.';
        }
        if (endemism === 'NotFoundInFFB') {
          text = 'A espécie é ou não é endêmica do Brasil (COLOCAR_CITAÇÃO).';
        }
      } else {
        // Não há registros no Brasil
        text += 'Não foram encontrados registros da espécie no Brasil.';

        if (endemism === true) {
          text += 'A espécie é endêmica do Brasil (citação FFB), porém não registramos ocorrência da espécie nesse país.';
        }
        if (endemism === false) {
          text += 'Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil (citação FFB), mas não registramos ocorrências no Brasil.';
        }
        if (endemism === 'NotFoundInFFB') {
          text = 'Não foram encontrados registros da espécie no Brasil (COLOCAR_CITAÇÃO).';
        }
      }

      countries.forEach((country: any) => {
        const filtered = Object.values(municipalities).filter((m: any) => m.country === country);
        const groupedByState: any = filtered.reduce((acc: any, cur: any) => {
          const { firstLvl, secondLvl } = cur;
          const firstLvl_ = `${firstLvl}`;

          if (!acc[firstLvl_]) {
            acc[firstLvl_] = {
              firstLvl: firstLvl,
              municipalities: [],
            };
          }

          acc[firstLvl_].municipalities.push(secondLvl);

          return acc;
        }, {});

        const countryText = Object.values(groupedByState)
          .map(({ firstLvl, municipalities }) => {
            let stateLabel, municipalityLabel;

            if (country === 'Brasil') {
              stateLabel = 'estado';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else if (country === 'Venezuela') {
              stateLabel = 'estado';
              municipalityLabel = municipalities.length > 1 ? 'municípios (ou cidades)' : 'município (ou cidade)';
            } else if (country === 'Paraguai') {
              stateLabel = 'departamento';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else if (country === 'Bolívia') {
              stateLabel = 'departamento';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else if (country === 'Peru') {
              stateLabel = 'departamento';
              municipalityLabel = municipalities.length > 1 ? 'províncias' : 'província';
            } else if (country === 'Guianas') {
              stateLabel = 'região';
              municipalityLabel = municipalities.length > 1 ? 'comunidades' : 'comunidade';
            } else if (country === 'Colômbia') {
              stateLabel = 'província';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else if (country === 'Equador') {
              stateLabel = 'província';
              municipalityLabel = municipalities.length > 1 ? 'cantões' : 'cantão';
            } else if (country === 'Suriname') {
              stateLabel = 'distrito';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else if (country === 'Uruguai') {
              stateLabel = 'departamento';
              municipalityLabel = municipalities.length > 1 ? 'cidades (ou lugares populados)' : 'cidade (ou lugar populado)';
            } else if (country === 'Guaiana Francesa') {
              stateLabel = 'arrondissement';
              municipalityLabel = municipalities.length > 1 ? 'comunas' : 'comuna';
            } else if (country === 'Argentina') {
              stateLabel = 'departamento';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            } else {
              stateLabel = 'estado';
              municipalityLabel = municipalities.length > 1 ? 'municípios' : 'município';
            }

            const municipalitiesText = `${municipalityLabel} ${municipalities.sort().join(', ')}`;
            return `no ${stateLabel} ${firstLvl} \u2014 ${municipalitiesText} \u2014`;
          })
          .join('. ');

        text += `No ${country}, apresenta distribuição: ${countryText}. `;
      });

      text = text.replace(/\s\u2014\.\sn/g, ' \u2014, n');
      text = text.replace(/\s\u2014\.\sN/g, '. N');
      text = text.replace(/\s\u2014\.\s$/, '.');
      text = text.replace(/\.N/g, '. N');
      text = text.replace('No Argentina', 'Na Argentina');
      text = text.replace('No Bolívia', 'Na Bolívia');
      text = text.replace('No Colômbia', 'Na Colômbia');
      text = text.replace('No Guiana', 'Na Guiana');
      text = text.replace('No Venezuela', 'Na Venezuela');
      text = text.replace(/no província/g, 'na província');
      text = text.replace(/Caiena/g, 'Cayenne');
      

      text = text.replace(/distribuição\. No Brasil, apresenta distribuição:/, 'distribuição');

      if (text.startsWith('N')) {
        text = 'A espécie não é endêmica do Brasil (citação FFB). ' + text
      }

      if (text === 'A espécie não é endêmica do Brasil (citação FFB). Não foram encontrados registros da espécie no Brasil.A espécie é endêmica do Brasil (citação FFB), porém não registramos ocorrência da espécie nesse país.') {
        text = 'A espécie é endêmica do Brasil (citação FFB). Não registramos qualquer ocorrência da espécie.'
      }

      if (text === 'A espécie não é endêmica do Brasil (citação FFB). Não foram encontrados registros da espécie no Brasil.Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil (citação FFB), mas não registramos ocorrências no Brasil.') {
        text = 'A espécie não é endêmica do Brasil (citação FFB). Não registramos qualquer ocorrência da espécie.'
      }

      let regex = /A espécie não é endêmica do Brasil \(citação FFB\)\. Não foram encontrados registros da espécie no Brasil\.Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil \(citação FFB\), mas não registramos ocorrências no Brasil\.(.*)/;
      text = text.replace(regex, (match, group1) => `A espécie não é endêmica do Brasil (citação FFB), mas não registramos ocorrências no país. ${group1}`);

      text = text.replace(
        'A espécie não é endêmica do Brasil \(citação FFB\)\. Não foram encontrados registros da espécie no Brasil (COLOCAR_CITAÇÃO)',
        'Não foram encontrados registros da espécie no Brasil (COLOCAR_CITAÇÃO)'
      )

      return text;
    }

    const distributionText: any = generateDistributionText(distribution);
    result = { bestMatch: distribution, text: distributionText }

    fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/distribution/${job.data.species}.json`, JSON.stringify(result), 'utf8', (err) => {
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
