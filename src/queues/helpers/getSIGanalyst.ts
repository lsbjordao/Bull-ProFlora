import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';

async function getSIGanalyst(species: string, source: 'CNCFlora-oldSystem'|'CNCFlora-ProFlora'|'Museu-Goeldi/PA'): Promise<any> {
    const keyPath = './credentials.json';
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ];

    const credentials = new JWT({
        keyFile: keyPath,
        scopes: scopes,
    });

    await credentials.authorize();

    let spreadsheetId: string = ''

    if(source === 'CNCFlora-oldSystem'){
        spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
    }

    if(source === 'CNCFlora-ProFlora'){
        spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
    }

    if(source === 'Museu-Goeldi/PA'){
        spreadsheetId = '1swPXVm9AD2IyNtslwjOf7Pq5cXC0unbdd_YnJjfuvnI';
    }
    
    const sheets = google.sheets({ version: 'v4', auth: credentials });
    
    const sheetName = 'Acomp_spp';

    const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: [`${sheetName}!C2:C`, `${sheetName}!G2:G`],
    });

    const valueRanges: (sheets_v4.Schema$ValueRange | undefined)[] = res.data.valueRanges ?? [];

    const listOfSpecies: any[][] = valueRanges[0]?.values ?? [];
    const SIGanalyst: any[][] = valueRanges[1]?.values ?? [];

    const idx = listOfSpecies.findIndex((s: any) => s[0] === species);

    let output;
    if (SIGanalyst[idx] !== undefined) {
        output = SIGanalyst[idx][0];
    } else {
        output = 'SIG analyst not found';
    }

    return output;
}

export { getSIGanalyst };
