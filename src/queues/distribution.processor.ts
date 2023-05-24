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
    const species = job.data.species;

    this.logger.log(`Processing ${job.id}`);

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    const speciesOcc: any = await getOcc(job.data.species);
    const speciesUrns = speciesOcc.urns;
    const speciesStates = speciesOcc.states;
    const speciesMunicipalities = speciesOcc.municipalities;

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    const informationFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/information/${job.data.species}.json`;

    let records: any = await fs.promises.readFile(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    const recordsUrns = records.map((element: any) => element.properties.urn);

    let information: any = await fs.promises.readFile(informationFilePath, 'utf-8');
    information = JSON.parse(information);
    let endemicFFB = information.endemism;
    if (endemicFFB === 'YES') { endemicFFB = true };
    if (endemicFFB === 'NO') { endemicFFB = false };

    let result: any = [];

    for (let i = 0; i < speciesStates.length; i++) {
      if (recordsUrns.includes(speciesUrns[i])) {
        const obj = {
          state: speciesStates[i],
          municipality: speciesMunicipalities[i]
        };
        result.push(obj);
      }
    }

    result = _.filter(result, function (item: any) {
      return item.state !== '' && item.municipality !== '';
    });

    result = _.uniq(result, false, function (item: any) {
      return JSON.stringify(item);
    });

    const distribution: any = result.map((obj: any) => {
      const { state, municipality } = obj;
      const bestMatch = admDivisions.getBestMatch(state, municipality);
      bestMatch.firstLvl_search = state;
      bestMatch.secondLvl_search = municipality;
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
          if (endemicFFB === true) {
            text += 'A espécie é considerada endêmica do Brasil (citação FFB); no entanto, encontramos registros fora do Brasil em nossa base de dados.';
          }
          if (endemicFFB === false) {
            text += 'A espécie não é endêmica do Brasil (citação FFB).';
          }
        }
      } else if (countries.length === 1 && countries[0] === 'Brasil') {
        // Nossa base possui registros apenas do Brasil
        if (endemicFFB === true) {
          text += 'A espécie é endêmica do Brasil (citação FFB), com distribuição.';
        }
        if (endemicFFB === false) {
          text += 'Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil (citação FFB); no entanto, não registramos ocorrências fora desse país.';
        }
      } else {
        // Não há registros no Brasil
        text += 'Não foram encontrados registros da espécie no Brasil.';

        if (endemicFFB === true) {
          text += 'A espécie é endêmica do Brasil (citação FFB), porém não registramos ocorrência da espécie nesse país.';
        }
        if (endemicFFB === false) {
          text += 'Segundo a Flora e Funga do Brasil, a espécie não é endêmica do Brasil (citação FFB), mas não registramos ocorrências no Brasil.';
        }
      }

      countries.forEach((country: any) => {
        const filtered = Object.values(municipalities).filter((m: any) => m.country === country);
        const groupedByState: any = filtered.reduce((acc: any, cur: any) => {
          const { firstLvl, secondLvl } = cur;
          const state = `${firstLvl}`;

          if (!acc[state]) {
            acc[state] = {
              state: firstLvl,
              municipalities: [],
            };
          }

          acc[state].municipalities.push(secondLvl);

          return acc;
        }, {});

        const countryText = Object.values(groupedByState)
          .map(({ state, municipalities }) => {
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
            return `no ${stateLabel} ${state} \u2014 ${municipalitiesText} \u2014`;
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

      return text;
    }

    const distributionText: any = generateDistributionText(distribution);
    result = { bestMatch: distribution, text: distributionText }

    fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/distribution/${job.data.species}.json`, JSON.stringify(result), 'utf8', (err) => {
      if (err) {
        console.error(err);
      }
    });

    return Promise.resolve(result);
    
  } catch(err: Error) {
    console.error(err);
    return null;
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
