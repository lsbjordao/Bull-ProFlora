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
import { getOccFromProFlora } from './helpers/getOccFromProFlora';

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
    const source = job.data.source;
    const datasetName = job.data.datasetName;

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

      let speciesOcc: any = []

      if (source === 'CNCFlora-oldSystem') { speciesOcc = await getOcc(species) }
      if (
        source === 'CNCFlora-ProFlora' ||
        source === 'Museu-Goeldi/PA'
      ) { speciesOcc = await getOccFromProFlora(species, datasetName, source) }

      const speciesOccIds = speciesOcc.occIds
      const recordsOccIds = records.map((element: any) => element.properties.oocId)
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

      let speciesMunicipalities = speciesOcc.municipalities;

      let checkedValidation: any = [];

      for (let i = 0; i < speciesStates.length; i++) {
        if (recordsOccIds.includes(speciesOccIds[i])) {
          const obj = {
            states: speciesStates[i],
            municipalities: speciesMunicipalities[i]
          };
          checkedValidation.push(obj);
        }
      }
      const speciesStatesValidated: any = [];
      const speciesMunicipalitiesValidated: any = [];

      checkedValidation.forEach((item: any) => {
        speciesStatesValidated.push(item.states);
        speciesMunicipalitiesValidated.push(item.municipalities);
      });

      speciesStates = speciesStatesValidated
      speciesMunicipalities = speciesMunicipalitiesValidated

      // Municípios Prioritários da Amazônia Legal
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
