import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import * as R from 'r-script';


export const QUEUE_NAME_threats = 'Threats';
export const InjectQueue_threats = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_threats);

@Processor(QUEUE_NAME_threats, {
  concurrency: 1,
})
export class Processor_threats extends WorkerHost {
  private readonly logger = new Logger(Processor_threats.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    const recordsFilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${job.data.species}.json`;
    let records: any = fs.readFileSync(recordsFilePath, 'utf-8');
    records = JSON.parse(records);

    job.updateProgress(2);

    let result: any;
    if (records.length === 0) {
      result = {
        "AOO": [],
        "EOO": []
      };
      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/threats/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });
      job.updateProgress(100);
      return Promise.resolve('No records.');
    }

    if (records.length > 0) {
      job.updateProgress(3);
      const rScriptPath = './src/queues/functions/trendAnalysis.R';

      function runRScript(y: any) {
        return new Promise((resolve, reject) => {
          R(rScriptPath)
            .data({ y: y })
            .call((err: Error, result: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
        });
      }

      async function readJsonFile(filePath: any) {
        try {
          const jsonData = await fs.promises.readFile(filePath, 'utf-8');
          return JSON.parse(jsonData);
        } catch (err) {
          console.error(`Erro ao ler o arquivo ${filePath}: ${err}`);
          return null;
        }
      }


      // MapBiomas Land cover
      const oacMapBiomasLandCoverfilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandCover7/${job.data.species}.json`;
      const oacMapBiomasLandCoverfilePathJson = await readJsonFile(oacMapBiomasLandCoverfilePath);

      const threats: any = {
        "9": "Silvicultura",
        "14": "Agropecuária",
        "15": "Pastagem",
        "18": "Agricultura",
        "19": "Lavoura temporária",
        "20": "Cana",
        "21": "Mosaico de usos",
        "24": "Área urbanizada",
        "30": "Mineração",
        "31": "Aquicultura",
        "35": "Cultura de palma",
        "36": "Lavoura perene",
        "39": "Soja",
        "40": "Arroz",
        "41": "Outras lavouras temporárias",
        "46": "Café",
        "47": "Citrus",
        "48": "Outras lavouras perenes",
        "51": "Área urbana",
        "52": "Infraestrutura",
        "53": "Outras áreas urbanizadas",
        "57": "Cultivos simples",
        "58": "Cultivos múltiples",
        "62": "Algodão"
      }

      job.updateProgress(4);

      // AOO
      const AOO = oacMapBiomasLandCoverfilePathJson.AOO;
      const AOOvalue = oacMapBiomasLandCoverfilePathJson.AOO_km2;

      const AOOvalues: any = {};
      for (let i = 0; i < AOO.length; i++) {
        let band = AOO[i].band;
        let year = band.substring(band.lastIndexOf('_') + 1);

        let groups = AOO[i].areaKm2.groups;

        for (let j = 0; j < groups.length; j++) {
          let threatValue = groups[j].class;

          if ([9, 15, 18, 19, 20, 21, 24, 30, 35, 36, 39, 40, 41, 46, 47, 48, 57, 58, 62].includes(threatValue)) {
            let sumValue = groups[j].sum;

            if (!AOOvalues[threatValue]) {
              AOOvalues[threatValue] = {};
            }

            if (!AOOvalues[threatValue][year]) {
              AOOvalues[threatValue][year] = sumValue;
            } else {
              AOOvalues[threatValue][year] += sumValue;
            }
          }
        }
      }

      const AooThreats: any = {};
      for (const key in AOOvalues) {
        AooThreats[threats[key]] = AOOvalues[key];
      }

      // Threats greather than 5%
      let relevantAooThreats: any = {};
      for (const key of Object.keys(AooThreats)) {
        let areaPercentage = AooThreats[key]['2021'] / AOOvalue;
        if (areaPercentage >= 0.05) {
          relevantAooThreats[key] = AooThreats[key];
        }
      }

      const relevantAooThreatsPercentage: any = {};
      for (const key in relevantAooThreats) {
        const values = relevantAooThreats[key];
        const percentageValues: any = {};

        for (const year in values) {
          const value = values[year];
          const percentage = (value / AOOvalue) * 100;
          percentageValues[year] = percentage;
        }

        relevantAooThreatsPercentage[key] = percentageValues;
      }

      interface ThreatData {
        [year: string]: number;
      }

      function fillMissingYears(obj: ThreatData) {
        const years = Object.keys(obj);
        const minYear = 1985
        const maxYear = Math.max(...years.map((year) => parseInt(year, 10)))

        for (let year = minYear; year <= maxYear; year++) {
          if (!obj.hasOwnProperty(year.toString())) {
            obj[year.toString()] = 0;
          }
        }
      }

      for (const key in relevantAooThreatsPercentage) {
        if (Object.hasOwnProperty.call(relevantAooThreatsPercentage, key)) {
          const obj = relevantAooThreatsPercentage[key];
          fillMissingYears(obj);
        }
      }

      const AOOresult = [];
      for (const key in relevantAooThreatsPercentage) {
        const values = relevantAooThreatsPercentage[key];
        const y = [];
        for (const year in values) {
          const value = values[year];
          y.push(value);
        }

        const trendAnalysis: any = await runRScript(y);

        const lastYear_km2 = relevantAooThreats[key]["2021"];
        AOOresult.push({
          "threat": key.toLowerCase(),
          "lastYear": "2021",
          "trendAnalysis": trendAnalysis[0],
          "lastYear_km2": lastYear_km2,
          "lastYear_percentage": relevantAooThreatsPercentage[key]["2021"]
        });

      }

      const AOOoutput = AOOresult;

      job.updateProgress(5);

      // EOO
      const EOO = oacMapBiomasLandCoverfilePathJson.EOO;
      const EOOvalue = oacMapBiomasLandCoverfilePathJson.EOO_km2;
      let EOOoutput: any;

      if (EOOvalue > 0) {
        const EOOvalues: any = {};
        for (let i = 0; i < EOO.length; i++) {
          let band = EOO[i].band;
          let year = band.substring(band.lastIndexOf('_') + 1);

          let groups = EOO[i].areaKm2.groups;

          for (let j = 0; j < groups.length; j++) {
            let threatValue = groups[j].class;

            if ([9, 15, 18, 19, 20, 21, 24, 30, 35, 36, 39, 40, 41, 46, 47, 48, 57, 58, 62].includes(threatValue)) {
              let sumValue = groups[j].sum;

              if (!EOOvalues[threatValue]) {
                EOOvalues[threatValue] = {};
              }

              if (!EOOvalues[threatValue][year]) {
                EOOvalues[threatValue][year] = sumValue;
              } else {
                EOOvalues[threatValue][year] += sumValue;
              }
            }
          }
        }

        const EooThreats: any = {};
        for (const key in EOOvalues) {
          EooThreats[threats[key]] = EOOvalues[key];
        }

        // Threats greather than 5%
        let relevantEooThreats: any = {};
        for (const key of Object.keys(EooThreats)) {
          let areaPercentage = EooThreats[key]['2021'] / EOOvalue;
          if (areaPercentage >= 0.05) {
            relevantEooThreats[key] = EooThreats[key];
          }
        }

        const relevantEooThreatsPercentage: any = {};
        for (const key in relevantEooThreats) {
          const values = relevantEooThreats[key];
          const percentageValues: any = {};

          for (const year in values) {
            const value = values[year];
            const percentage = (value / EOOvalue) * 100;
            percentageValues[year] = percentage;
          }

          relevantEooThreatsPercentage[key] = percentageValues;
        }

        const EOOresult = [];
        for (const key in relevantEooThreatsPercentage) {
          const values = relevantEooThreatsPercentage[key];
          const y = [];
          for (const year in values) {
            const value = values[year];
            y.push(value);
          }
          const trendAnalysis: any = await runRScript(y);
          const lastYear_km2 = relevantEooThreats[key]["2021"];
          EOOresult.push({
            "threat": key.toLowerCase(),
            "lastYear": "2021",
            "trendAnalysis": trendAnalysis[0],
            "lastYear_km2": lastYear_km2,
            "lastYear_percentage": relevantEooThreatsPercentage[key]["2021"]
          });
        }

        EOOoutput = EOOresult;
      } else {
        EOOoutput = [];
      }

      job.updateProgress(7);

      // MapBiomas fire
      const oacMapBiomasFirefilePathfilePath = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-Fire/${job.data.species}.json`;
      const oacMapBiomasFireJson = await readJsonFile(oacMapBiomasFirefilePathfilePath);

      const classes: any = {
        0: "Out",
        1: "Floresta",
        2: "Leñosas cerradas",
        3: "Formação florestal",
        4: "Formação savânica",
        5: "Mangue",
        6: "Floresta inundável",
        9: "Silvicultura",
        11: "Campo alagado e área pantanosa",
        12: "Formação campestre",
        13: "Outras formações não florestais",
        15: "Pastagem",
        18: "Agricultura",
        19: "Lavoura temporária",
        20: "Cana",
        21: "Mosaico de usos",
        22: "Áreas não vegetadas",
        23: "Praia, duna e areal",
        24: "Área urbanizada",
        25: "Outras áreas não vegetadas",
        27: "Não observado",
        29: "Afloramento rochoso",
        30: "Mineração",
        31: "Aquicultura",
        32: "Apicum",
        33: "Rio, lago e oceano",
        34: "Geleira",
        35: "Cultura de palma",
        36: "Lavoura perene",
        39: "Soja",
        40: "Arroz",
        41: "Outras lavouras temporárias",
        42: "Pastizal abierto",
        43: "Pastizal cerrado",
        44: "Pastizal disperso",
        45: "Leñosas dispersas",
        46: "Café",
        47: "Citrus",
        48: "Outras lavouras perenes",
        49: "Restinga arborizada",
        57: "Cultivos simples",
        58: "Cultivos múltiples",
        62: "Algodão",
        63: "NoData"
      }

      job.updateProgress(9);
      // AOO Fire
      const AOOfire = oacMapBiomasFireJson.AOO;

      const AOOfireValues: any = {};
      for (let i = 0; i < AOOfire.length; i++) {
        let band = AOOfire[i].band;
        let year = band.substring(band.lastIndexOf('_') + 1);

        let groups = AOOfire[i].areaKm2.groups;

        for (let j = 0; j < groups.length; j++) {
          let classValue = groups[j].class;

          if ([1, 2, 3, 4, 5, 6, 9, 11, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 32, 33, 34, 35, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 57, 58, 62].includes(classValue)) {
            let sumValue = groups[j].sum;

            if (!AOOfireValues[classValue]) {
              AOOfireValues[classValue] = {};
            }

            if (!AOOfireValues[classValue][year]) {
              AOOfireValues[classValue][year] = sumValue;
            } else {
              AOOfireValues[classValue][year] += sumValue;
            }
          }
        }
      }

      const AooFireThreats: any = {};
      for (const key in AOOfireValues) {
        AooFireThreats[classes[key]] = AOOfireValues[key];
      }

      // Threats greather than 5%
      let relevantAooFireThreats: any = [];
      let AoototalAreaPercentage = 0;

      for (const key of Object.keys(AooFireThreats)) {
        let areaPercentage = AooFireThreats[key]['2022'] / AOOvalue;
        if (isNaN(areaPercentage)) {
          areaPercentage = 0;
        }
        AoototalAreaPercentage += areaPercentage;

        if (AoototalAreaPercentage >= 0.05) {
          if (areaPercentage !== 0) {
            const data = {
              "class": key,
              "year": 2022,
              "km2": AooFireThreats[key]['2022'],
              "percent": areaPercentage
            };
            relevantAooFireThreats.push(data);
          }
        }
      }

      const AOOfireOutput = relevantAooFireThreats;

      job.updateProgress(11);
      // EOO Fire
      const EOOfire = oacMapBiomasFireJson.EOO;

      const EOOfireValues: any = {};
      for (let i = 0; i < AOOfire.length; i++) {
        let band = AOOfire[i].band;
        let year = band.substring(band.lastIndexOf('_') + 1);

        let groups = AOOfire[i].areaKm2.groups;

        for (let j = 0; j < groups.length; j++) {
          let classValue = groups[j].class;

          if ([1, 2, 3, 4, 5, 6, 9, 11, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 32, 33, 34, 35, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 57, 58, 62].includes(classValue)) {
            let sumValue = groups[j].sum;

            if (!EOOfireValues[classValue]) {
              EOOfireValues[classValue] = {};
            }

            if (!EOOfireValues[classValue][year]) {
              EOOfireValues[classValue][year] = sumValue;
            } else {
              EOOfireValues[classValue][year] += sumValue;
            }
          }
        }
      }

      const EooFireThreats: any = {};
      for (const key in EOOfireValues) {
        EooFireThreats[classes[key]] = EOOfireValues[key];
      }

      // Threats greather than 5%
      let relevantEooFireThreats: any = [];
      let EoototalAreaPercentage = 0;

      for (const key of Object.keys(EooFireThreats)) {
        let areaPercentage = EooFireThreats[key]['2022'] / EOOvalue;
        if (isNaN(areaPercentage)) {
          areaPercentage = 0;
        }
        EoototalAreaPercentage += areaPercentage;

        if (EoototalAreaPercentage >= 0.05) {
          if (areaPercentage !== 0) {
            const data = {
              "class": key,
              "year": 2022,
              "km2": EooFireThreats[key]['2022'],
              "percent": areaPercentage
            };
            relevantAooFireThreats.push(data);
          }
        }
      }

      const EOOfireOutput = relevantEooFireThreats;


      const output = { "AOO": AOOoutput, "EOO": EOOoutput, "AOOfire": AOOfireOutput, "EOOfire": EOOfireOutput };

      const result = output;

      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/threats/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
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
