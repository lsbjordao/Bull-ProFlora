import { existsSync } from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config()

async function sendGetRequest(taxon: string) {
    try {
        const taxonId = '1664'
        const url = `http://${process.env.ProFloraDev}/occurrence?taxonId=${taxonId}`;
        const config: any = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.ProFloraToken}`
            }
        };
        const response = await axios.get(url, config)
            .then(response => {
                return response.data._embedded.occurrence
            })
            .catch(error => {
                console.error('Erro:', error);
            });
        return response
    } catch (error) {
        console.error('Ocorreu um erro ao enviar a requisição:', error.message);
    }
}

async function getOccFromProFlora(taxon: string) {
    const data: any = await sendGetRequest(taxon)
    
    const result: any = {
        n: data.length,
        ids: data.map((occ: any) => occ.id),
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
        states: data.map((occ: any) => occ.stateProvince),
        municipalities: data.map((occ: any) => occ.municipality)
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