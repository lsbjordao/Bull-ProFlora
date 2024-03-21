import axios from 'axios';

// Method to send POST request
async function sendPostRequest(queue, species) {
    try {
        const url = `http://localhost:3005/${queue}`;
        const data = {
            "species": species
        };
        const response = await axios.post(url, data);
        console.log(response.data);
    } catch (error) {
        console.error('Ocorreu um erro ao enviar a requisição:', error.message);
    }
}

async function sendPostRequestWithSource(queue, species, source) {
    try {
        const url = `http://localhost:3005/${queue}`;
        const data = {
            "species": species,
            "source": source
        };
        const response = await axios.post(url, data);
        console.log(response.data);
    } catch (error) {
        console.error('Ocorreu um erro ao enviar a requisição:', error.message);
    }
}

// Add species
const speciesToAdd = [
    "Byrsonima intermedia"
]


speciesToAdd.forEach((species) => {
    sendPostRequest('information', species)
    sendPostRequest('citationFFB', species)
    sendPostRequest('obraPrinceps', species)
    sendPostRequestWithSource('records', species, 'CNCFlora-oldSystem')
    sendPostRequest('distribution', species)
    sendPostRequest('oa-mapbiomas-landcover', species)
    sendPostRequest('oa-mapbiomas-fire', species)
    sendPostRequest('oa-UCs', species)
    sendPostRequest('oa-TERs', species)
    sendPostRequest('oa-PANs', species)
    sendPostRequest('conservationActions', species)
    sendPostRequest('threats', species)
    sendPostRequest('speciesProfile', species)
})
