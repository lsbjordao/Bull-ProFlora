//@ts-nocheck

const Fuse = require('fuse.js')
const fs = require('fs');

function getBestMatch(firstLvl, secondLvl) {

    secondLvl = secondLvl.replace(/^D\.\s/, '')

    const divisions = fs.readFileSync('./src/queues/admDivisions/divisions.csv', 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => {
            const [country, firstLvl, secondLvl] = line.trim().split(',');
            return { country, firstLvl, secondLvl };
        });

    // Brasil
    // firstLvl = Estado
    // secondLvl = Município

    // Argentina
    // firstLvl = Província
    // secondLvl = Município

    // Colômbia
    // firstLvl = Departamento
    // secondLvl = Município

    // Peru
    // firstLvl = Departamento
    // secondLvl = Província
    // thirdLvl = Distrito

    // Bolívia
    // firstLvl = Departamento
    // secondLvl = Província
    // thirdLvl = Município

    // Paraguai
    // firstLvl = Departamento
    // secondLvl = Município

    // Equador
    // firstLvl = Província
    // secondLvl = Cantão

    // Guiana
    // firstLvl = Região
    // secondLvl = Cidade

    // Guiana Francesa
    // firstLvl = Arrondissement
    // secondLvl = Comuna

    // Suriname
    // firstLvl = Distrito
    // secondLvl = Cantão

    // Uruguai
    // firstLvl = Departamento
    // secondLvl = Município

    // Venezuela ??
    // firstLvl = Estado
    // secondLvl = Município
    // thirdLvl = Paróquia
    // forthLvl = Cidade

    const optionsFirstLvl = {
        keys: [
            { name: 'firstLvl' }
        ],
        threshold: 0.7,
        useExtendedSearch: true
    };

    let fuse = new Fuse(divisions, optionsFirstLvl);
    let bestMatchesFirstLvl = fuse.search(firstLvl);
    bestMatchesFirstLvl = bestMatchesFirstLvl.map((element) => element.item);

    const identicalFirstLvl = bestMatchesFirstLvl.some(element => element.firstLvl === firstLvl);

    if (identicalFirstLvl) {
        bestMatchesFirstLvl = bestMatchesFirstLvl.filter(element => element.firstLvl === firstLvl);
    }

    const optionsSecondLvl = {
        keys: [
            { name: 'secondLvl' }
        ],
        useExtendedSearch: true
    };

    fuse = new Fuse(bestMatchesFirstLvl, optionsSecondLvl);
    let bestMatchSecondLvl = fuse.search(secondLvl);

    if (bestMatchSecondLvl.length === 0) {
        bestMatchSecondLvl = [
            {
                item: {
                    country: bestMatchesFirstLvl[0].country,
                    firstLvl: bestMatchesFirstLvl[0].firstLvl,
                    secondLvl: 'desconhecido'
                }
            }
        ]
    }

    if (bestMatchSecondLvl.length > 0) {
        bestMatchSecondLvl = bestMatchSecondLvl[0].item;

        // Synonyms check
        function checkAndChange(jsonObj: any, country: string, firstLvl: string, secondLvl: string, newSecondLvl: string) {
            if (
                jsonObj.country === country &&
                jsonObj.firstLvl === firstLvl &&
                jsonObj.secondLvl === secondLvl
            ) {
                return { ...jsonObj, secondLvl: newSecondLvl };
            }
            return jsonObj;
        }

        // Guiana
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Acquero', // secondLvl
            'Akwero' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Aqueero', // secondLvl
            'Akwero' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Baramanna', // secondLvl
            'Baramani' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Barimanni', // secondLvl
            'Baramani' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Baramanni', // secondLvl
            'Baramani' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Five Star Landing', // secondLvl
            'Five Star' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Kokerit Landing', // secondLvl
            'Kokerite' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Kwabanna', // secondLvl
            'Kwebanna' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Saint Bedes', // secondLvl
            "Saint Bede's Mission" // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Santa Rosa Mission', // secondLvl
            'Santa Rosa' // newSecondLvl
        )
        bestMatchSecondLvl = checkAndChange(
            bestMatchSecondLvl,
            'Guiana', // country
            'Barima-Waini', // firstLvl
            'Waramuri Mission', // secondLvl
            'Waramuri' // newSecondLvl
        )
        
    }

    return bestMatchSecondLvl;
}

export { getBestMatch };