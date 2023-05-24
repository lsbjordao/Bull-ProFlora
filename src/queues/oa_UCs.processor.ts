import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import * as _ from 'underscore';
import * as turf from '@turf/turf';

export const QUEUE_NAME_oa_UCs = 'OA-UCs';
export const InjectQueue_oa_UCs = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_oa_UCs);

@Processor(QUEUE_NAME_oa_UCs, {
  concurrency: 1,
})
export class Processor_oa_UCs extends WorkerHost {
  private readonly logger = new Logger(Processor_oa_UCs.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    this.logger.log(`Processing ${job.id}`);

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    let records: any = fs.readFileSync(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    let result: any;
    if (records.length === 0) {
      result = [];
      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/oac/UCs/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });
      return Promise.resolve('No records.');
    }

    if (records.length > 0) {

      const regexCentroide = /[cC]entr[oó]ide de [Mm]unic[ií]pio/;
      const recordsUtil = records.filter((obj: any) => !regexCentroide.test(obj.properties.precision))

      async function getCoords(records: any) {
        const coords = records.map((feature: any) => {
          return {
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0]
          };
        });

        const coordinates = coords.map(({ lat, lon }: { lat: any, lon: any }) => ({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));

        return coordinates
      }

      const coordinates = await getCoords(recordsUtil);

      let coords;
      coords = coordinates.filter((coord: any) =>
        Object.values(coord).every((val: any) => /^-?\d+(\.\d+)?$/.test(val))
      );

      const UCsFilePath = './src/queues/geojsons/UCs.json';
      let UCs: any = fs.readFileSync(UCsFilePath, 'utf-8');
      UCs = JSON.parse(UCs);

      const polygons: any = UCs.features.map((feature: any) => turf.multiPolygon(feature.geometry.coordinates, feature.properties));

      let UCsPoly: any = [];
      let points: any = [];

      const coordRegex = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,15}/;

      for (let i = 0; i < coords.length; i++) {
        if (coordRegex.test(coords[i].latitude) && coordRegex.test(coords[i].longitude)) {
          const point = turf.point(
            [Number(coords[i].longitude), Number(coords[i].latitude)]
          )
          polygons.forEach((poly: any) => {
            const ptsWithin = turf.pointsWithinPolygon(point, poly)
            if (ptsWithin.features.length > 0) {
              UCsPoly.push(poly)
              points.push(point)
            }
          })
        }
      }
      let onlyUCsName: any = UCsPoly.map((data: any) => data.properties.NOME_UC1);
      onlyUCsName = _.uniq(onlyUCsName);

      function fixUcName(str: any) {
        str = str.toLowerCase().split(' ');
        for (var i = 0; i < str.length; i++) {
          str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
          if (str[i].indexOf('-') !== -1 || str[i].indexOf('/') !== -1) {
            var separator = str[i].indexOf('-') !== -1 ? '-' : '/';
            var parts = str[i].split(separator);
            for (var j = 0; j < parts.length; j++) {
              parts[j] = parts[j].charAt(0).toUpperCase() + parts[j].slice(1);
            }
            str[i] = parts.join(separator);
          }
        }
        return str.join(' ')
          .replace(/\sE\s/g, ' e ')
          .replace(/\sDe\s/g, ' de ')
          .replace(/\sDo\s/g, ' do ')
          .replace(/\sDa\s/g, ' da ')
          .replace(/\sDas\s/g, ' das ')
          .replace(/\sDos\s/g, ' dos ')
          .replace(/\s\s/g, ' ')
          .replace(/\s\s/g, ' ')
          .replace(/Àrea\s/g, 'Área ')
          .replace(/Area\s/g, 'Área ')
          .replace(/Ecologica/g, 'Ecológica')
          .replace(/Estacao/g, 'Estação')
          .replace(/\sIii/g, ' III')
          .replace(/\sIi/g, ' II')
          .replace(/\sIv/g, ' IV')
          .replace(/\sVii/g, ' VII')
          .replace(/""/g, '"')
          .replace(/\s-\sRvs\sPalmares/g, '')
          .replace(/Ciriáco/g, 'Ciriaco')
          .replace(/Municípal/g, 'Municipal')
          .replace(/Caetétaperaçu/g, 'Caeté-Taperaçu')
          .replace(/Iguatemí/g, 'Iguatemi')
          .replace(/Rppn\s/g, 'Reserva Particular do Patrimônio Natural ')
          .replace(/Arie\s/g, 'Área de Relevante Interesse Ecológico ')
          .replace(/Arie\s/g, 'Área de Relevante Interesse Ecológico ')
          .replace(/(\s|^)Apa\s/g, 'Área de Proteção Ambiental ')
          .replace(/Ecológico-\sIlhas/g, 'Ecológico - Ilhas')
          .replace(/Metrolpolitana/g, 'Metropolitana')
          .replace(/Tamandare/g, 'Tamandaré')
          .replace(/Refugio/g, 'Refúgio')
          .replace(/Palacio/g, 'Palácio')
          .replace(/Antonio/g, 'Antônio')
          .replace(/Piraque/g, 'Piraquê')
          .replace(/Bugiu/g, 'Bugio')
          .replace(/Iguaçú/g, 'Iguaçu')
          .replace(/Zabele/g, 'Zabelê')
          .replace(/Muncipal/g, 'Municipal')
          .replace(/Chapadao/g, 'Chapadão')
          .replace(/Araucarias/g, 'Araucárias')
          .replace(/Cabreuva/g, 'Cabreúva')
          .replace(/Munumento/g, 'Monumento')
          .replace(/Arquipelago/g, 'Arquipélago')
          .replace(/\sAndre\s/g, ' André ')
          .replace(/Patriomônio/g, 'Patrimônio')
          .replace(/Paraiba/g, 'Paraíba')
          .replace(/Caparao/g, 'Caparaó')
          .replace(/\sCapao\s/g, ' Capão ')
          .replace(/Corrego/g, 'Córrego')
          .replace(/Chaua/g, 'Chauá')
          .replace(/Parnaiba/g, 'Parnaíba')
          .replace(/Pracuuba/g, 'Pracuúba')
          .replace(/Biologica/g, 'Biológica')
          .replace(/Sassafras/g, 'Sassafrás')
          .replace(/Lençois/g, 'Lençóis')
          .replace(/Aguas\s/g, 'Águas ')
          .replace(/Patrimonio/g, 'Patrimônio')
          .replace(/\sOrgãos/g, ' Órgãos')
          .replace(/\sPerimetro\s/g, ' Perímetro ')
          .replace(/\sTejupa\s/g, ' Tejupá ')
          .replace(/Área\sde\sProteção\sAmbiental\s-Área\sde\sProteção\sAmbiental\sda\sPerdição/g, 'Área de Proteção Ambiental da Perdição')
          .replace(/Ambiental\sCorumbataí\sBotucatu\sTejupá\sPerímetro/g, 'Ambiental Corumbataí, Botucatu e Tejupá - Perímetro')
          .replace(/Alegre\s1a/g, 'Alegre 1A')
          .replace(/Cb\s-\sCartonagem/g, 'CB - Cartonagem')
          .replace(/\sApaep/g, '')
          .replace(/\s\//g, '/')
          .replace(/\/\s/g, '/')
          .replace(/D(´|')água/g, "d'Água")
          .replace(/Dágua/g, "d'Água")
          .replace(/Caixa\sD\sÁgua/g, "Caixa d'Água")
          .replace(/D(´|')Ouro/g, "d'Ouro")
          .replace(/\./g, '')
          .replace(/Botujuru-Serra/g, 'Botujuru - Serra')
          .replace(/\s\(Sc\)/g, '');
      }

      const UCsOutput = onlyUCsName.map((UC: any) => fixUcName(UC))

      const result: any = UCsOutput;

      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/oac/UCs/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });

      return Promise.resolve(result);

    }

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
