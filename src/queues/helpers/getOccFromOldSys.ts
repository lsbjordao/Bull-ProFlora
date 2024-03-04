import { readFile, existsSync } from 'fs';
import * as cheerio from 'cheerio';

function getOcc(input: any) {
  return new Promise((resolve, reject) => {
    const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${input}.html`;

    readFile(filePath, 'utf-8', (err, html) => {
      if (err) {
        reject(err);
        return;
      }

      const $ = cheerio.load(html);

      const validationRecords = $('.label-valid')
        .map((i, element) => $(element).text().match(/[\p{L}\d]+/u)?.[0])
        .get();

      const validationSIG = $('.label-sig')
        .map((i, element) => $(element).text().match(/\w+\s\w+/u)?.[0])
        .get();

      const urns = $('a')
        .map((i, element) => $(element).attr('name'))
        .get()
        .filter((_, index) => index % 2 !== 1)
        .slice(1);

      const states: any = [];
      const municipalities: any = [];

      $('.col-md-3').each(function (index, element) {
        const stateProvinceElement = $(element).find('#stateProvince');
        const municipalityElement = $(element).find('#municipality');

        if (stateProvinceElement.length > 0 && municipalityElement.length > 0) {
          const stateProvince = stateProvinceElement.attr('value');
          const municipality = municipalityElement.attr('value');

          states.push(stateProvince);
          municipalities.push(municipality);
        }
      });

      const inputs = $('.col-md-6 input');
      const coords = inputs.map((i, element) => {
        return $(element).attr('value');
      }).get();

      const coordsMat = [];
      const ncol = 6;
      for (let i = 0; i < coords.length; i += ncol) {
        coordsMat.push(coords.slice(i, i + ncol));
      }
      coordsMat.forEach(row => {
        row.splice(4, 2);
      });
      const headers = ['lat', 'lon', 'precision', 'protocol'];
      const coordsObj = coordsMat.map(row => {
        if (row.length !== headers.length) {
          throw new Error(`Matriz de coordenadas inválida: ${row}`);
        }
        const obj: { [key: string]: any } = {};
        row.forEach((val: any, idx: number) => {
          obj[headers[idx]] = val;
        });
        return obj;
      });

      const result = {
        n: urns.length,
        urns: urns,
        validationRecords: validationRecords,
        validationSIG: validationSIG,
        coordsObj: coordsObj,
        states: states,
        municipalities: municipalities
      };

      resolve(result);
    });
  });
}

function hasFile(input: any) {
  return new Promise((resolve, reject) => {
    const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${input}.html`;
    if (existsSync(filePath)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

export {
  getOcc,
  hasFile
}