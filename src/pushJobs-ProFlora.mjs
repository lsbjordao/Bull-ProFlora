import { Queue } from 'bullmq';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { existsSync } from 'fs';
import axios from 'axios';
import { ConsoleLogger } from '@nestjs/common';

function initQueue(queueName) {
  return new Queue(queueName, {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  });
}

// Initiate queues
const queueRecords = initQueue('Records');
// const queueInformation = initQueue('Information');
const queueFFB = initQueue('FFB');
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
    const data = { species };
    const response = await axios.post(url, data);
    console.log(response.data);
  } catch (error) {
    console.error('Erro ao enviar a requisição:', error.message);
  }
}

async function sendPostRequestWithSource(queue, species, source) {
  try {
    const url = `http://localhost:3005/${queue}`;
    const data = { species, source };
    const response = await axios.post(url, data);
    console.log(response.data);
  } catch (error) {
    console.error('Erro ao enviar a requisição:', error.message);
  }
}

async function sendPostRequestWithSourceAndDataset(queue, species, source, datasetName) {
  try {
    const url = `http://localhost:3005/${queue}`;
    const data = { species, source, datasetName };
    const response = await axios.post(url, data);
    console.log(response.data);
  } catch (error) {
    console.error('Erro ao enviar a requisição:', error.message);
  }
}

async function pushJobs() {
  const keyPath = '../credentials.json';
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  const credentials = new JWT({
    keyFile: keyPath,
    scopes: scopes,
  });
  await credentials.authorize();

  const ss = google.sheets({ version: 'v4', auth: credentials });
  const spreadsheetId = '17n2VMQse1uAsvgWA3fXFhewIz1hclliA5d85h8FMHHI';
  const sheetName = 'List_for_HTML_profile';

  ss.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!D2:E`,
    },
    (err, res) => {
      if (err) {
        console.error('Erro ao obter os valores da coluna D-E:', err);
        return;
      }

      const rows = res.data.values;
      const listOfSpecies = [];
      const datasetNames = [];

      rows.forEach(row => {
        const [dataset, species] = row;

        if (species && species !== '#N/A') {
          listOfSpecies.push(species);
          datasetNames.push(dataset);
        }
      });

      processRecordsQueue(queueRecords, listOfSpecies, 'CNCFlora-ProFlora', datasetNames);
      // processQueue(queueInformation, listOfSpecies, 'information', 'CNCFlora-ProFlora');
      processQueue(queueFFB, listOfSpecies, 'FFB');
      processQueue(queueObrasPrinceps, listOfSpecies, 'obraPrinceps');
      processDistributionQueue(queueDistribution, listOfSpecies, 'CNCFlora-ProFlora', datasetNames);
      processOaMapBiomasQueue(queueOaMapBiomasLandCover, listOfSpecies, 'oa-mapbiomas-landcover');
      processOaMapBiomasQueue(queueOaMapBiomasFire, listOfSpecies, 'oa-mapbiomas-fire');
      processOaQueue(queueOaUCs, listOfSpecies, 'oa-UCs');
      processOaQueue(queueOaTERs, listOfSpecies, 'oa-TERs');
      processOaQueue(queueOaPANs, listOfSpecies, 'oa-PANs');
      processConservationActionsQueue(queueConservationActions, listOfSpecies, 'CNCFlora-ProFlora', datasetNames);
      processThreatsQueue(queueThreats, listOfSpecies);
      processSpeciesProfileQueue(queueSpeciesProfile, listOfSpecies);
    }
  );
}

function processQueue(queue, listOfSpecies, queueName, source) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => !jobNames.includes(species));
    speciesToAdd.forEach(species => {
      if (source) {
        sendPostRequestWithSource(queueName, species, source);
      } else {
        sendPostRequest(queueName, species);
      }
    });
  });
}

function processRecordsQueue(queue, listOfSpecies, source, datasetNames) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => !jobNames.includes(species));
    speciesToAdd.forEach(species => {
      const index = listOfSpecies.indexOf(species);
      const correspondingDatasetName = datasetNames[index];
      if (source && correspondingDatasetName) {
        sendPostRequestWithSourceAndDataset('records', species, source, correspondingDatasetName);
      }
    });
  })
}

function processDistributionQueue(queue, listOfSpecies, source, datasetNames) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);

    const speciesToAdd = listOfSpecies.filter(species => {
      const pathRecords = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
      const pathFFB = `G:/Outros computadores/Meu computador/CNCFlora_data/FFB/${species}.json`;
      return !jobNames.includes(species) && existsSync(pathRecords) && existsSync(pathFFB);
    });

    speciesToAdd.forEach(species => {
      const index = listOfSpecies.indexOf(species);
      const correspondingDatasetName = datasetNames[index];

      if (source && correspondingDatasetName) {
        sendPostRequestWithSourceAndDataset('distribution', species, source, correspondingDatasetName);
      }
    });
  })
}

function processOaMapBiomasQueue(queue, listOfSpecies, queueName) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => {
      const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
      return !jobNames.includes(species) && existsSync(path);
    });
    speciesToAdd.forEach(species => {
      sendPostRequest(queueName, species);
    });
  });
}

function processOaQueue(queue, listOfSpecies, queueName) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => {
      const path = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
      return !jobNames.includes(species) && existsSync(path);
    });
    speciesToAdd.forEach(species => {
      sendPostRequest(queueName, species);
    });
  });
}

function processThreatsQueue(queue, listOfSpecies) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => {
      const pathRecords = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
      const pathOacMapBiomasLandCover = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-LandCover7/${species}.json`;
      const pathOacMapBiomasFire = `G:/Outros computadores/Meu computador/CNCFlora_data/oac/MapBiomas-Fire/${species}.json`;
      return (
        !jobNames.includes(species) &&
        existsSync(pathRecords) &&
        existsSync(pathOacMapBiomasLandCover) &&
        existsSync(pathOacMapBiomasFire)
      );
    });
    speciesToAdd.forEach(species => {
      sendPostRequest('threats', species);
    });
  });
}

function processConservationActionsQueue(queue, listOfSpecies, source, datasetNames) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);

    const speciesToAdd = listOfSpecies.filter(species => {
      const pathRecords = `G:/Outros computadores/Meu computador/CNCFlora_data/records/${species}.json`;
      return !jobNames.includes(species) && existsSync(pathRecords)
    });

    speciesToAdd.forEach(species => {
      const index = listOfSpecies.indexOf(species);
      const correspondingDatasetName = datasetNames[index];

      if (source && correspondingDatasetName) {
        sendPostRequestWithSourceAndDataset('conservationActions', species, source, correspondingDatasetName);
      }
    });
  })
}

function processSpeciesProfileQueue(queue, listOfSpecies, source) {
  queue.getJobs().then(jobs => {
    const jobNames = jobs.map(job => job.data.species);
    const speciesToAdd = listOfSpecies.filter(species => !jobNames.includes(species));

    const dirsToCheck = [
      'distribution',
      //'information',
      'obrasPrinceps',
      'FFB',
      'oac/MapBiomas-LandCover7',
      'oac/MapBiomas-Fire',
      'oac/PANs',
      'oac/TERs',
      'oac/UCs',
      'conservationActions',
      'threats',
    ];

    speciesToAdd.forEach(species => {
      const fileExists = dirsToCheck.map(dir => {
        const path = `G:/Outros computadores/Meu computador/CNCFlora_data/${dir}/${species}.json`;
        return existsSync(path) ? 1 : 0;
      });

      const isReady = fileExists.reduce((total, num) => total + num, 0) === dirsToCheck.length;

      if (isReady && !jobNames.includes(species)) {
        sendPostRequestWithSource('speciesProfile', species, 'CNCFlora-ProFlora');
      }
    });
  });
}

pushJobs()

setInterval(() => {
  const now = new Date();
  const formattedDate = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false,
  });

  console.log(formattedDate);
  pushJobs();
}, 10000);