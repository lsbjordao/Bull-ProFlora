// getAllTaxonIds.mjs

import { readFileSync } from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';
dotenv.config();

const taxa = readFileSync('getAllTaxonIds.csv', 'utf8')
    .split('\n')
    .map(line => line.replace('\r', '').split(','))
    .flat();

async function processTaxa(taxon, index) {
    const genus = taxon.replace(/(\w+).*/, '$1');
    const specificEpithet = taxon.replace(/\w+\s([\w-]+).*/, '$1');
    let varietyEpithet = '';
    let subspeciesEpithet = '';

    let hasVarietyEpithet = false;
    if (taxon.includes(' var. ')) {
        hasVarietyEpithet = true;
    }
    if (hasVarietyEpithet) {
        varietyEpithet = taxon.replace(/.*var\. ([\w-]+).*/, '$1');
    }
    let hasSubspeciesEpithet = false;
    if (taxon.includes(' subsp. ')) {
        hasSubspeciesEpithet = true;
    }
    if (hasSubspeciesEpithet) {
        subspeciesEpithet = taxon.replace(/.*subsp\. ([\w-]+).*/, '$1');
    }

    const configGetToken = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const body = {
        "grant_type": "password",
        "username": "lucasjordao@jbrj.gov.br",
        "password": "-FWst_aJDN06",
        "client_id": "cncflora_api",
        "client_secret": "05Mb14$28_&tr"
    };

    let urlBase = 'https://web05.jbrj.gov.br:8080';

    const endpoint_oauth = `${urlBase}/oauth`;

    const ProFloraToken = await axios.post(endpoint_oauth, body, configGetToken)
        .then(response => response.data.access_token)
        .catch(error => {
            console.error('Error getting token:', error);
            return null;
        });

    if (!ProFloraToken) return;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${ProFloraToken}`
        }
    };

    let endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}`;
    if (hasVarietyEpithet) {
        endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}&varietyEpithet=${varietyEpithet}`;
    }
    if (hasSubspeciesEpithet) {
        endpoint_getTaxonId = `${urlBase}/get-taxon-id-by-scientificname?genus=${genus}&specificEpithet=${specificEpithet}&subspeciesEpithet=${subspeciesEpithet}`;
    }

    const taxonId = await axios.get(endpoint_getTaxonId, config)
        .then(response => response.data._embedded.get_taxon_id_by_scientificname[0].id)
        .catch(error => {
            console.error('Error getting taxon ID:', error);
            return null;
        });

    if (taxonId) {
        console.log(taxonId);
    }
}

(async () => {
    for (let [index, taxon] of taxa.entries()) {
        await processTaxa(taxon, index);
        await setTimeout(2000); // Pausa de 2 segundos entre as requisições
    }
})();
