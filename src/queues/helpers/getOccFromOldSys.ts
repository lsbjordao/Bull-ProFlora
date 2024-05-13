import { readFile, existsSync } from 'fs'
import * as cheerio from 'cheerio'

function getOcc(input: any) {
  return new Promise((resolve, reject) => {
    const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${input}.html`

    readFile(filePath, 'utf-8', (err, html) => {
      if (err) {
        reject(err)
        return
      }

      const $ = cheerio.load(html)

      const validationRecords = $('.label-valid')
        .map((i, element) => $(element).text().match(/[\p{L}\d]+/u)?.[0])
        .get()

      const validationSIG = $('.label-sig')
        .map((i, element) => $(element).text().match(/\w+\s\w+/u)?.[0])
        .get()

      const urns = $('a')
        .map((i, element) => $(element).attr('name'))
        .get()
        .filter((_, index) => index % 2 !== 1)
        .slice(1)

      let states: any = []
      let municipalities: any = []

      $('.col-md-3').each(function (index, element) {
        const stateProvinceElement = $(element).find('#stateProvince')
        const municipalityElement = $(element).find('#municipality')

        const stateProvince = stateProvinceElement.attr('value')
        const municipality = municipalityElement.attr('value')
        
        states.push(stateProvince)
        municipalities.push(municipality)
      })

      states = states.filter((element: any, index: number) => (index + 1) % 4 === 0)
      municipalities = municipalities.filter((element: any, index: number) => (index + 1) % 4 === 0)

      let coordsObj: any = []
      $('.col-md-3').each(function (index, element) {

        const latElement = $(element).find('input[name="decimalLatitude"]')
        const lonElement = $(element).find('input[name="decimalLongitude"]')
        const precisionElement = $(element).find('input[name="georeferencePrecision"]')
        const protocolElement = $(element).find('input[name="georeferenceProtocol"]')

        const latValue = latElement.attr('value')
        const lonValue = lonElement.attr('value')
        const precisionValue = precisionElement.attr('value')
        const protocolValue = protocolElement.attr('value')

        coordsObj.push({
          lat: latValue,
          lon: lonValue,
          precision: precisionValue,
          protocol: protocolValue
        })
      })

      coordsObj = coordsObj.filter((obj: any) => typeof obj.lat === 'string' && typeof obj.lon === 'string')

      const result = {
        n: urns.length,
        occIds: urns,
        validationRecords: validationRecords,
        validationSIG: validationSIG,
        coordsObj: coordsObj,
        states: states,
        municipalities: municipalities
      }

      resolve(result)
    })
  })
}

function hasFile(input: any) {
  return new Promise((resolve, reject) => {
    const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${input}.html`
    if (existsSync(filePath)) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

export {
  getOcc,
  hasFile
}