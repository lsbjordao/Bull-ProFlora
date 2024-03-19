import { Queue } from 'bullmq';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { existsSync } from 'fs';
import axios from 'axios';

function initQueue(queueName) {
  return new Queue(queueName, {
    connection: {
      host: 'localhost',
      port: 6379
    }
  });
}

// Initiate queues
const queueRecords = initQueue('Records');
const queueInformation = initQueue('Information');
const queueCitation_FFB = initQueue('Citation FFB');
const queueObrasPrinceps = initQueue('Obras princeps');
const queueDistribution = initQueue('Distribution');
const queueOaMapBiomasLandCover = initQueue('OA-MapBiomas-LandCover');
const queueOaMapBiomasFire = initQueue('OA-MapBiomas-Fire');
const queueOaUCs = initQueue('OA-UCs');
const queueOaTERs = initQueue('OA-TERs');
const queueOaPANs = initQueue('OA-PANs');
const queueConservationActions = initQueue('Conservation actions');
const queueThreats = initQueue('Threats');
const queueSpeciesProfile = initQueue('Species profile');


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

async function pushJobs() {

  // Get list of species from follow-up table
  const keyPath = '../credentials.json';
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
  ];
  const credentials = new google.auth.JWT({
    keyFile: keyPath,
    scopes: scopes,
  });
  await credentials.authorize();

  const ss = google.sheets({ version: 'v4', auth: credentials });
  const spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
  const sheetName = 'List_for_HTML_profile';

  ss.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!E2:E`,
  }, (err, res) => {
    if (err) {
      console.error('Erro ao obter os valores da coluna E:', err);
      return;
    }

    function mainLoop() {

      const listOfSpecies = (res.data.values).flat();

      // Queue Records from CNCFlora-oldSystem
      queueRecords.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${species}.html`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequestWithSource('records', species, 'CNCFlora-oldSystem');
        });
      });

      // Queue Records from Museu-Goeldi/PA
      queueRecords.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/inputs/occurrences/oldSystem/${species}.html`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequestWithSource('records', species, 'CNCFlora-oldSystem');
        });
      });

      // Queue Information
      queueInformation.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            return !jobNames.includes(species);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('information', species);
        });
      });

      // Queue Citation FFB
      queueCitation_FFB.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            return !jobNames.includes(species);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('citationFFB', species);
        });
      });

      // Queue Obras princeps
      queueObrasPrinceps.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            return !jobNames.includes(species);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('obraPrinceps', species);
        });
      });

      // Queue Distribution
      queueDistribution.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const pathRecords = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            const pathInformation = `G:/Outros computadores/Meu computador/CNCFlora_data/information/${species}.json`;
            return !jobNames.includes(species) && existsSync(pathRecords) && existsSync(pathInformation);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('distribution', species);
        });
      });

      // Queue OA-MapBiomas-LandCover
      queueOaMapBiomasLandCover.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('oa-mapbiomas-landcover', species);
        });
      });

      // Queue OA-MapBiomas-Fire
      queueOaMapBiomasFire.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('oa-mapbiomas-fire', species);
        });
      });

      // Queue OA-UCs
      queueOaUCs.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('oa-UCs', species);
        });
      });

      // Queue OA-TERs
      queueOaTERs.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('oa-TERs', species);
        });
      });

      // Queue OA-PANs
      queueOaPANs.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('oa-PANs', species);
        });
      });

      // Queue Conservation actions
      queueConservationActions.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            return !jobNames.includes(species) && existsSync(path);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('conservationActions', species);
        });
      });

      // Queue Threats
      queueThreats.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (species) {
            return species.toString();
          })
          .filter(function (species) {
            const pathRecords = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
            const pathOacMapBiomasLandCover = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandCover7/${species}.json`;
            return !jobNames.includes(species) && existsSync(pathRecords) && existsSync(pathOacMapBiomasLandCover);
          });

        speciesToAdd.forEach((species) => {
          sendPostRequest('threats', species);
        });
      });

      // Queue Species profile
      queueSpeciesProfile.getJobs().then(async (jobs) => {
        const jobNames = jobs.map(function (job) {
          return job.data.species;
        });

        const speciesToAdd = listOfSpecies
          .map(function (value) {
            return value.toString();
          })
          .filter(function (value) {
            return !jobNames.includes(value);
          });

        function checkFileExists(filePath) {
          return existsSync(filePath);
        }

        const completedList = []

        setInterval(check, 3000)

        function check() {
          const dirsToCheck = [
            'distribution',
            'information',
            'obrasPrinceps',
            'citationFFB',
            'oac/MapBiomas-LandCover7',
            'oac/MapBiomas-Fire',
            'oac/PANs',
            'oac/TERs',
            'oac/UCs',
            'conservationActions',
            'threats'
          ]
          speciesToAdd.forEach(species => {

            if (completedList.indexOf(species) === -1) {
              const fileExists = dirsToCheck.map(dir => {
                const path = `G:/Outros computadores/Meu computador/CNCFlora_data/${dir}/${species}.json`
                return checkFileExists(path) ? 1 : 0
              })
              function getSum(total, num) {
                return total + num
              }
              const isReady = (fileExists.reduce(getSum, 0)) === dirsToCheck.length

              if (isReady) {
                sendPostRequest('speciesProfile', species);
                completedList.push(species)
              }
            }
          })
        }
      });
    }

    const interval = 100000 // 10 min
    setInterval(mainLoop, interval);
  });
}

pushJobs()
