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
    "Machaerium brasiliense",
"Machaerium acutifolium",
"Machaerium mucronulatum",
"Machaerium floridum",
"Machaerium sericiflorum",
"Bonamia agrostopolis",
"Bonamia agrostopolis var. agrostopolis",
"Bonamia agrostopolis var. velutina",
"Bonamia austinii",
"Bonamia balansae",
"Bonamia campestris",
"Bonamia capitata",
"Bonamia cerradoensis",
"Bonamia eustachioi",
"Bonamia ferruginea",
"Bonamia krapovickasii",
"Bonamia kuhlmannii",
"Bonamia langsdorffii",
"Bonamia linearifolia",
"Bonamia maripoides",
"Bonamia rosiewiseae",
"Bonamia sphaerocephala",
"Bonamia subsessilis",
"Bonamia umbellata",
"Vriesea claudiana",
"Agalinis marianae",
"Paubrasilia echinata",
"Baccharis albilanosa",
"Baccharis dunensis",
"Baccharis gaucha",
"Baccharis gibertii",
"Baccharis hyemalis",
"Baccharis inexspectata",
"Baccharis multifolia",
"Baccharis pampeana",
"Baccharis pluricapitulata",
"Porophyllum spathulatum",
"Dyckia alba",
"Dyckia hebdingii",
"Dyckia pontesii",
"Dyckia pseudodelicata",
"Dyckia retardata",
"Frailea buenekeri",
"Frailea cataphracta",
"Frailea curvispina",
"Frailea fulviseta",
"Frailea mammifera",
"Parodia crassigibba",
"Parodia curvispina",
"Parodia fusca",
"Parodia gaucha",
"Parodia ibicuiensis",
"Parodia neobuenekeri",
"Parodia neohorstii",
"Paronychia revoluta",
"Ipomoea pampeana",
"Dioscorea microcephala",
"Caperonia hystrix",
"Chiropetalum ramboi",
"Croton calycireduplicatus",
"Croton gnaphalii",
"Croton helichrysum",
"Croton malacotrichus",
"Croton nitrariifolius",
"Croton pygmaeus",
"Croton quintasii",
"Croton ramboi",
"Croton thymelinus",
"Euphorbia pedersenii",
"Sellocharis paradoxa",
"Cunila fasciculata",
"Lejeunea bornmuellerii",
"Leandra camporum",
"Habenaria dutrae",
"Galianthe elegans",
"Phoradendron holoxanthum",
"Piriqueta pampeana",
"Tarenaya eosina",
"Eriocaulon pilgeri",
"Paepalanthus sedoides",
"Croton lepidus",
"Jatropha weddeliana",
"Bronwenia longipilifera",
"Heteropterys corumbensis",
"Stigmaphyllon matogrossense",
"Sida dureana",
"Wissadula stipulata",
"Nymphaea belophylla",
"Cipocereus laniflorus"
]


speciesToAdd.forEach((species) => {
    // sendPostRequest('information', species)
    // sendPostRequest('citationFFB', species)
    // sendPostRequest('obraPrinceps', species)
    // sendPostRequestWithSource('records', species, 'CNCFlora-oldSystem')
    // sendPostRequest('distribution', species)
    // sendPostRequest('oa-mapbiomas-landcover', species)
    // sendPostRequest('oa-mapbiomas-fire', species)
    // sendPostRequest('oa-UCs', species)
    // sendPostRequest('oa-TERs', species)
    // sendPostRequest('oa-PANs', species)
    // sendPostRequest('conservationActions', species)
    // sendPostRequest('threats', species)
    sendPostRequest('speciesProfile', species)
})
