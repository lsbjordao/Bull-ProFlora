import { existsSync } from 'fs';
import axios from 'axios';
import { getToken } from './getToken';
import * as dotenv from 'dotenv';
dotenv.config()

async function sendGetRequest(taxon: string) {

const genus = taxon.replace(/(\w+).*/, '$1')
const specificEpithet = taxon.replace(/\w+\s([\w-]+).*/, '$1');
let varietyEpithet = ''
let subspeciesEpithet = ''

let hasVarietyEpithet = false
if(taxon.includes(' var. ')){
    hasVarietyEpithet = true
}
if(hasVarietyEpithet){
    varietyEpithet = taxon.replace(/.*var\. ([\w-]+).*/, '$1');
}
let hasSubspeciesEpithet = false
if(taxon.includes(' subsp. ')){
    hasSubspeciesEpithet = true
}
if(hasSubspeciesEpithet){
    subspeciesEpithet = taxon.replace(/.*subsp\. ([\w-]+).*/, '$1');
}


    try {
        const ProFloraToken = await getToken()

        const config: any = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${ProFloraToken}`
            }
        }

        let urlBase = process.env.ProFloraUrlBaseProd
        if (process.env.NODE_ENV === 'dev') { urlBase = process.env.ProFloraUrlBaseDev }
        
        let endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}`
        if(hasVarietyEpithet){
            endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}&varietyEpithet=${varietyEpithet}`
        }
        if(hasSubspeciesEpithet){
            endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}&subspeciesEpithet=${subspeciesEpithet}`
        }

        const taxonId = await axios.get(endpoint_getTaxonId, config)
            .then(response => {
                return response.data._embedded.get_taxon_id_by_scientificname[0].id
            })
            .catch(error => {
                console.error('Error getting taxon ID:', error);
            })

        const endpoint_getOccs = `${urlBase}/occurrence?taxonId=${taxonId}`;

        const responseOccs = await axios.get(endpoint_getOccs, config)
            .then(response => {
                return response.data._embedded.occurrence
            })
            .catch(error => {
                console.error('Error getting occurrences:', error);
            });

        return responseOccs
    } catch (error) {
        console.error('Ocorreu um erro ao enviar a requisição:', error.message);
    }
}

async function getOccFromProFlora(taxon: string) {
    const data: any = await sendGetRequest(taxon)
    console.log(data)
    const result: any = {
        n: data.length,
        occIds: data.map((occ: any) => occ.id),
        validationRecords: data.map((occ: any) => occ.isValid),
        validationSIG: data.map((occ: any) => occ.gisStatusId),
        coordsObj: data.map((occ: any) => {
            return {
                lat: occ.latitude,
                lon: occ.longitude,
                precision: occ.georeferencePrecisionId,
                protocol: occ.georeferenceProtocolId
            };
        }),
        states: data.map((occ: any) => occ.externalProcess.sigStateName),
        municipalities: data.map((occ: any) => occ.externalProcess.sigMunicipalityName),
        contries: data.map((occ: any) => occ.externalProcess.sigCountryName)
    };
    return result
}

function hasFile(input: any) {
    return new Promise((resolve, reject) => {
        const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${input}.json`;
        if (existsSync(filePath)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

export {
    getOccFromProFlora,
    hasFile
}