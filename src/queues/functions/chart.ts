//@ts-nocheck
import * as ejs from 'ejs';
import * as fs from 'fs';
import { _ } from 'underscore';

import { classes } from '../constant/mapBiomasClasses';
import { natural, anthropic } from '../constant/mapBiomasClassesGrouped';

async function stackedArea(geometry: string, series: any, geometryAreaValue: number) {

    if (geometry === 'EOO' && geometryAreaValue === 0) { } else {
        let seriesData: any[] = [];

        series.forEach((band: any) => {

            const palette = {
                "Floresta": "#129912",
                "Formação florestal": "#006400",
                "Formação savânica": "#00ff00",
                "Mangue": "#687537",
                "Floresta inundável": "#76A5AF",
                "Silvicultura": "#ad4413",
                "Campo alagado e área pantanosa": "#45C2A5",
                "Formação campestre": "#B8AF4F",
                "Outras formações não florestais": "#f1c232",
                "Pastagem": "#FFD966",
                "Lavoura temporária": "#D5A6BD",
                "Cana": "#C27BA0",
                "Mosaico de usos": "#fff3bf",
                "Praia, duna e areal": "#DD7E6B",
                "Área urbanizada": "#aa0000",
                "Outras áreas não vegetadas": "#ff3d3d",
                "Não observado": "#D5D5E5",
                "Afloramento rochoso": "#665a3a",
                "Mineração": "#af2a2a",
                "Aquicultura": "#02106f",
                "Apicum": "#968c46",
                "Rio, lago e oceano": "#0000FF",
                "Lavoura perene": "#f3b4f1",
                "Soja": "#e075ad",
                "Arroz": "#982c9e",
                "Cultura de palma": "#BA6A27",
                "Outras lavouras temporárias": "#e787f8",
                "Café": "#cca0d4",
                "Citrus": "#d082de",
                "Outras lavouras perenes": "#cd49e4",
                "Restinga arborizada": "#6b9932",
                "Algodão": "#660066",
                "Geleira": "#4FD3FF",
                "Leñosas cerradas": "#006400",
                "Leñosas dispersas": "#D0FFD0",
                "Leñosas inundables": "#76A5AF",
                "Pastizal abierto": "#EBEBE0",
                "Pastizal cerrado": "#C2C2A3",
                "Pastizal disperso": "#6B6B47",
                "Áreas não vegetadas": "#EA9999",
                "Cultivos múltiples": "#FF6666",
                "Cultivos simples": "#CC66FF",
                "Agricultura": "#e974ed",
                "Out": "black",
                "NoData": "black"
            };

            const target = Object.keys(classes).map((key) => ({ class: Number(key), sum: 0 }));

            const orderClasses: { [key: string]: number } = _.object(_.map(target, (obj, i) => [obj.class.toString(), i]));
            band.areaKm2.groups = _.sortBy(_.values(_.extend(_.indexBy(target, 'class'), _.indexBy(band.areaKm2.groups, 'class'))), (obj) => orderClasses[obj.class.toString()]);

            band.areaKm2.groups.forEach((data: any) => {
                const excludeClasses = [2, 7, 8, 10, 14, 16, 17, 26, 28, 37, 38, 50, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63];
                if (excludeClasses.indexOf(data.class) === -1) {
                    const key = classes.hasOwnProperty(data.class) ? classes[data.class] : 'Out';
                    const classIndex = _.findIndex(seriesData, { name: key });
                    const sum = data.sum;
                    if (classIndex === -1) {
                        seriesData.push({
                            name: key,
                            data: [sum],
                            color: palette[key],
                        });
                    } else {
                        seriesData[classIndex].data.push(sum);
                    }
                } else {
                    
                }
            });
        });

        for (let i = 0; i < seriesData.length; i++) {
            let sum = seriesData[i].data.reduce((acc, val) => acc + val, 0);
            if (sum === 0) {
                seriesData.splice(i, 1);
                i--;
            }
        }
        seriesData = seriesData.map(obj => ({
            ...obj,
            data: obj.data.map(val => val * 100 / geometryAreaValue)
        }));

        function getHTMLString(series: any[]) {
            return new Promise<string>((resolve, reject) => {
                ejs.renderFile(
                    './src/queues/chart-templates/stackedArea.ejs',
                    {
                        feature: geometry,
                        series: series
                    },
                    (err, str) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }

                        resolve(str);
                    }
                );
            });
        }

        const htmlString = await getHTMLString(seriesData);

        fs.writeFileSync(`G:/Outros computadores/Meu computador/CNCFlora_data/outputs/stackedArea-chart/${geometry}.html`, htmlString);

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
                name: 'natural',
                data: groupedData['natural'] || new Array(natural.length).fill(0),
                color: 'green'
            },
            {
                name: 'anthropic',
                data: groupedData['anthropic'] || new Array(anthropic.length).fill(0),
                color: 'red'
            }
        ];

        const htmlString2 = await getHTMLString(seriesDataGroupedOutput);

        fs.writeFileSync(`G:/Outros computadores/Meu computador/CNCFlora_data/outputs/stackedArea-chart/${geometry} - Natural vs Anthropic.html`, htmlString2);
    }
}

export { stackedArea };

async function trendline(series: any, featureAreaValue: number, feature: string) {

    let seriesData: any[] = [];

    series.forEach((band: any) => {

        const target = Object.keys(classes).map((key) => ({ class: Number(key), sum: 0 }));

        const orderClasses: { [key: string]: number } = _.object(_.map(target, (obj, i) => [obj.class.toString(), i]));
        band.areaKm2.groups = _.sortBy(_.values(_.extend(_.indexBy(target, 'class'), _.indexBy(band.areaKm2.groups, 'class'))), (obj) => orderClasses[obj.class.toString()]);

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
                
            }
        });
    });

    for (let i = 0; i < seriesData.length; i++) {
        let sum = seriesData[i].data.reduce((acc, val) => acc + val, 0);
        if (sum === 0) {
            seriesData.splice(i, 1);
            i--;
        }
    }
    seriesData = seriesData.map(obj => ({
        ...obj,
        data: obj.data.map(val => val * 100 / featureAreaValue)
    }));

    function getHTMLString(classSeries: any[], className: string) {
        return new Promise<string>((resolve, reject) => {
            ejs.renderFile(
                './src/queues/chart-templates/trendline.ejs',
                {
                    feature: feature,
                    y: classSeries,
                    className: className,
                },
                (err, str) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }

                    resolve(str);
                }
            );
        });
    }

    seriesData.forEach(async (series: any) => {
        const className: string = series.name
        const classSeries: any = series.data

        const htmlString = await getHTMLString(classSeries, className);
        fs.writeFileSync(`G:/Outros computadores/Meu computador/CNCFlora_data/outputs/trendline-chart-mapbiomas-landcover/${feature} - ${className}.html`, htmlString);
    })

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

    seriesDataGroupedOutput.forEach(async (series: any) => {
        const className: string = series.name
        const classSeries: any = series.data

        const htmlString = await getHTMLString(classSeries, className);

        fs.writeFileSync(`G:/Outros computadores/Meu computador/CNCFlora_data/outputs/trendline-chart-mapbiomas-landcover/${feature} - ${className}.html`, htmlString);
    })

}

export { trendline }