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

// Add species
const speciesToAdd = [
    "Matelea microphylla",
    "Philodendron carajasense",
    "Cavalcantia glomerata",
    "Lepidaploa paraensis",
    "Monogereion carajensis",
    "Parapiqueria cavalcantei",
    "Anemopaegma carajasense",
    "Ipomoea cavalcantei",
    "Bulbostylis cangae",
    "Eleocharis pedrovianae",
    "Eriocaulon carajense",
    "Syngonanthus discretifolius",
    "Erythroxylum carajasense",
    "Erythroxylum nelson-rosae",
    "Mimosa dasilvae",
    "Sinningia minima",
    "Isoetes cangae",
    "Isoetes serracarajensis",
    "Utricularia physoceras",
    "Cuphea carajasensis",
    "Pleroma carajasense",
    "Uleiorchis longipedicellata",
    "Buchnera carajasensis",
    "Picramnia ferrea",
    "Peperomia albopilosa",
    "Peperomia pseudoserratirhachis",
    "Axonopus carajasensis",
    "Paspalum cangarum",
    "Paspalum carajasense",
    "Sporobolus multiramosus",
    "Borreria carajasensis",
    "Borreria elaiosulcata",
    "Borreria heteranthera",
    "Carajasia cangae",
    "Perama carajensis",
    "Daphnopsis filipedunculata",
    "Xyris brachysepala"
]

// Trendline chart
speciesToAdd.forEach((species) => {
    sendPostRequest('speciesProfile', species);
})

