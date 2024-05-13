//@ts-nocheck

import * as R from 'r-script';
import * as fs from 'fs';
import { _ } from 'underscore';

import { classes } from '../constant/mapBiomasClasses';
import { natural, anthropic } from '../constant/mapBiomasClassesGrouped';

interface ICalcRates {
    geometry: string,
    series: any,
    geometryAreaValue: number
}

async function calculateRates(data: ICalcRates) {
    return new Promise(async (resolve, reject) => {
        const { geometry, geometryAreaValue, series } = data;

        let seriesData: any[] = [];

        series.forEach((band: any) => {

            const target = Object.keys(classes).map((key) => ({ class: Number(key), sum: 0 }));

            const orderClasses: { [key: string]: number } = _.object(_.map(target, (obj: any, i: any) => [obj.class.toString(), i]));
            band.areaKm2.groups = _.sortBy(_.values(_.extend(_.indexBy(target, 'class'), _.indexBy(band.areaKm2.groups, 'class'))), (obj: any) => orderClasses[obj.class.toString()]);

            band.areaKm2.groups.forEach((data: any) => {
                const excludeClasses = [2, 7, 8, 10, 14, 16, 17, 26, 28, 37, 38, 50, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63];
                if (excludeClasses.indexOf(data.class) === -1) {
                    const key = classes.hasOwnProperty(data.class) ? classes[data.class] : 'Out';
                    const classIndex = _.findIndex(seriesData, { name: key });
                    const sum = data.sum;
                    if (classIndex === -1) {
                        seriesData.push({
                            name: key,
                            data: [sum]
                        });
                    } else {
                        seriesData[classIndex].data.push(sum);
                    }
                } else {
                    // console.log(data.class);
                }
            });
        });

        for (let i = 0; i < seriesData.length; i++) {
            let sum = seriesData[i].data.reduce((acc: any, val: any) => acc + val, 0);
            if (sum === 0) {
                seriesData.splice(i, 1);
                i--;
            }
        }
        seriesData = seriesData.map(obj => ({
            ...obj,
            data: obj.data.map((val: any) => val * 100 / geometryAreaValue)
        }));

        const seriesDataGrouped = seriesData;

        function getCategory(name) {
            if (natural.includes(name)) {
                return 'natural';
            } else if (anthropic.includes(name)) {
                return 'anthropic';
            }
            return null;
        }

        const groupedData = {};

        for (const item of seriesDataGrouped) {
            const category = getCategory(item.name);
            if (category) {
                if (!groupedData[category]) {
                    groupedData[category] = new Array(item.data.length).fill(0);
                }
                for (let i = 0; i < item.data.length; i++) {
                    const value = isNaN(item.data[i]) ? 0 : item.data[i];
                    groupedData[category][i] += value;
                }
            }
        }

        const seriesDataGroupedOutput = [
            {
                name: 'Natural',
                data: groupedData['natural'] || new Array(natural.length).fill(0),
                color: 'green'
            },
            {
                name: 'Uso alternativo',
                data: groupedData['anthropic'] || new Array(anthropic.length).fill(0),
                color: 'red'
            }
        ];

        seriesData = seriesData.concat(seriesDataGroupedOutput);

        const rScriptPath = './src/queues/functions/trendAnalysis2022.R';

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

        let output: any[] = [];

        const promises = seriesData.map(series => runRScript(series.data));

        Promise.all(promises).then(promisesResult => {
            promisesResult.forEach((result, index) => {
                output.push({
                    class: seriesData[index].name,
                    annualRate: result[0].annualRate,
                    pValue: result[0].pValue,
                    rSquared: result[0].rSquared,
                });
            });

            fs.writeFileSync(`G:/Outros computadores/Meu computador/CNCFlora_data/outputs/trendline-rates-mapbiomas-landcover/${geometry}.json`, JSON.stringify(output));
            resolve(true);
        });

    })

}

export { calculateRates, ICalcRates }