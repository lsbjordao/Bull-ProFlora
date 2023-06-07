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
        "AOO": [],
        "EOO": []
      };
      fs.writeFile(`G:/Outros computadores/Meu computador/CNCFlora_data/threats/${job.data.species}.json`, JSON.stringify(result), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }
      });
      return Promise.resolve('No records.');
    }

    if (records.length > 0) {

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

      const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandUse7/${job.data.species}.json`;
      const oacJson = await readJsonFile(filePath);

      const threats: any = {
        "9": "Silvicultura",
        "15": "Pastagem",
        "21": "Mosaico de usos",
        "24": "Área urbanizada",
        "30": "Mineração"
      }

      // AOO
      const AOO = oacJson.AOO;
      const AOOvalue = oacJson.AOO_km2;

      const AOOvalues: any = {};
      for (let i = 0; i < AOO.length; i++) {
        let band = AOO[i].band;
        let year = band.substring(band.lastIndexOf('_') + 1);

        let groups = AOO[i].areaKm2.groups;

        for (let j = 0; j < groups.length; j++) {
          let threatValue = groups[j].class;

          if ([9, 15, 21, 24, 30].includes(threatValue)) {
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

      // EOO
      const EOO = oacJson.EOO;
      const EOOvalue = oacJson.EOO_km2;
      let EOOoutput: any;

      if (EOOvalue > 0) {
        const EOOvalues: any = {};
        for (let i = 0; i < EOO.length; i++) {
          let band = EOO[i].band;
          let year = band.substring(band.lastIndexOf('_') + 1);

          let groups = EOO[i].areaKm2.groups;

          for (let j = 0; j < groups.length; j++) {
            let threatValue = groups[j].class;

            if ([9, 15, 21, 24, 30].includes(threatValue)) {
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

      const output = { "AOO": AOOoutput, "EOO": EOOoutput };

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
