import { google } from 'googleapis';
import { writeFile, existsSync } from 'fs';

async function makeScript() {
  const keyPath = '../credentials.json';
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
  ];

  try {
    const credentials = new google.auth.JWT({
      keyFile: keyPath,
      scopes: scopes,
    });

    await credentials.authorize();
    const sheets = google.sheets({ version: 'v4', auth: credentials });
    const spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
    const sheetName = 'List_for_HTML_profile';

    // Obtém os valores das colunas A, B e C
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A2:E`,
    });

    const data = response.data.values || [];

    // Inicia a construção do script
    let script = '';

    // Adiciona a função hotkey
    script += 'F4::\n\n';

    // Loop sobre os dados para criar o script
    data.forEach(El => {
      if(!existsSync(`G:\\Outros computadores\\Meu computador\\CNCFlora_data\\inputs\\occurrences\\oldSystem\\${El[4]}.html`)){
        
        let i_URL = encodeURIComponent(El[4]);
  
        script += `run iexplore.exe -new http://cncflora.jbrj.gov.br/occurrences/${El[3]}/specie/${El[4]}\n`;
  
        if (El[0] === 'PNA') {
          script += 'Sleep 100000\n';
        } else if (El[0] === 'PA') {
          script += 'Sleep 40000\n';
        }
  
        script += 'Send ^s\n';
        script += 'Sleep 4000\n';
        script += `Send {Text}G:\\Outros computadores\\Meu computador\\CNCFlora_data\\inputs\\occurrences\\oldSystem\\${El[4]}\n`;
        script += 'Sleep 2000\n';
        script += 'Send {Tab}\n';
        script += 'Send {Down 3}\n';
        script += 'Send +{Tab}\n';
        script += 'Sleep 1000\n';
        script += 'Send {End}\n';
        script += 'Sleep 1000\n';
        script += 'Send {Text}.html\n';
        script += 'Sleep 1000\n';
        script += 'Send {Enter}\n';
        script += 'Sleep 35000\n';
        script += 'Send ^w\n\n';
      }
    })

    // Adiciona o retorno da hotkey
    script += 'return';

    // Escreve o script em um arquivo
    writeFile('./get_occurrences.ahk', script, (err) => {
      if (err) {
        console.error('Erro ao escrever o arquivo:', err);
      } else {
        console.log('Script criado com sucesso!');
      }
    });
  } catch (error) {
    console.error('Erro:', error);
  }
}

makeScript();
