import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import * as path from 'path';
import { getOcc } from './helpers/getOccFromOldSys';

export const QUEUE_NAME_conservationActions = 'Conservation actions';
export const InjectQueue_conservationActions = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_conservationActions);

@Processor(QUEUE_NAME_conservationActions, {
  concurrency: 1,
})
export class Processor_conservationActions extends WorkerHost {
  private readonly logger = new Logger(Processor_conservationActions.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    this.logger.log(`Processing #${job.id} - ${job.data.species}`);

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    let records: any = fs.readFileSync(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    let result: any;
    if (records.length === 0) {
      result = {
        threatenedLists: [],
        municipsPriorAL: []
      };
      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/conservationActions/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });
      return Promise.resolve(result);
    }

    if (records.length > 0) {

      const lists = './src/queues/conservationActions_lists';
      const files = await fs.promises.readdir(lists);

      type ThreatenedList = {
        File: string;
        Status: any;
      };

      type ResultType = {
        threatenedLists: ThreatenedList[];
        municipsPriorAL: any[];
      };

      const result: ResultType = {
        threatenedLists: [],
        municipsPriorAL: []
      };

      for (const file of files) {
        const pathFile = path.join(lists, file);
        const fileContent: Buffer = await fs.promises.readFile(pathFile);
        const json = JSON.parse(fileContent.toString());

        json.forEach((list: any) => {
          if (list.TAXON === job.data.species) {
            const threatenedList: ThreatenedList = {
              File: file,
              Status: list.STATUS
            };
            result.threatenedLists.push(threatenedList);
          }
        });
      }

      const speciesOcc: any = await getOcc(job.data.species);
      let speciesStates = speciesOcc.states;

      const stateToAbbreviation: any = {
        'Acre': 'AC',
        'Alagoas': 'AL',
        'Amapá': 'AP',
        'Amazonas': 'AM',
        'Bahia': 'BA',
        'Ceará': 'CE',
        'Distrito Federal': 'DF',
        'Espírito Santo': 'ES',
        'Goiás': 'GO',
        'Maranhão': 'MA',
        'Mato Grosso': 'MT',
        'Mato Grosso do Sul': 'MS',
        'Minas Gerais': 'MG',
        'Pará': 'PA',
        'Paraíba': 'PB',
        'Paraná': 'PR',
        'Pernambuco': 'PE',
        'Piauí': 'PI',
        'Rio de Janeiro': 'RJ',
        'Rio Grande do Norte': 'RN',
        'Rio Grande do Sul': 'RS',
        'Rondônia': 'RO',
        'Roraima': 'RR',
        'Santa Catarina': 'SC',
        'São Paulo': 'SP',
        'Sergipe': 'SE',
        'Tocantins': 'TO'
      };

      speciesStates = speciesStates.map((state: any) => {
        if (stateToAbbreviation[state]) {
          return stateToAbbreviation[state];
        } else {
          return state;
        }
      });

      const speciesMunicipalities = speciesOcc.municipalities;

      const listMunicipsPriorAL = './src/queues/conservationActions_lists/MunicipsPriorAL.json';
      const listMunicipsPriorALContent: any = await fs.promises.readFile(listMunicipsPriorAL);
      const jsonListMunicipsPriorAL = JSON.parse(listMunicipsPriorALContent.toString());

      const foundMunicipalities = jsonListMunicipsPriorAL.filter((element: any) => {
        const foundIndex = speciesMunicipalities.indexOf(element.MUNICIPIO);
        if (foundIndex !== -1) {
          return speciesStates[foundIndex] === element.UF;
        }
        return false;
      });

      foundMunicipalities.forEach((data: any) => result.municipsPriorAL.push(data));


      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/conservationActions/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });

      job.updateProgress(100);
      
      return Promise.resolve(result);

    }

  } catch(err: Error) {
    console.error(err);
    return null;
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
    this.logger.log(`Failed #${job.id} - ${job.data.species}`);
  }
}
