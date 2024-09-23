import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
dotenv.config();

async function whichFlow(species: string, source: 'CNCFlora-oldSystem' | 'CNCFlora-ProFlora' | 'Museu-Goeldi/PA'): Promise<any> {
    
    const keyPath = './credentials.json';
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ];

    const credentials = new JWT({
        keyFile: keyPath,
        scopes: scopes,
    });

    await credentials.authorize();
    
    let spreadsheetId: string = '';

    if (source === 'CNCFlora-oldSystem') {
        spreadsheetId = process.env.SPREADSHEET_ID_CNCFLORA_OLD!;
    }

    if (source === 'CNCFlora-ProFlora') {
        spreadsheetId = process.env.SPREADSHEET_ID_CNCFLORA_PROFLORA!;
    }

    if (source === 'Museu-Goeldi/PA') {
        spreadsheetId = process.env.SPREADSHEET_ID_MUSEU_GOELDI!;
    }
    
    const sheets = google.sheets({ version: 'v4', auth: credentials });
    const sheetName = 'List_for_HTML_profile';
    
    const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: [`${sheetName}!E2:E`, `${sheetName}!A2:A`, `${sheetName}!B2:B`, `${sheetName}!C2:C`],
    });
    
    const valueRanges: (sheets_v4.Schema$ValueRange | undefined)[] = res.data.valueRanges ?? [];

    const listOfSpecies: any[][] = valueRanges[0]?.values ?? [];
    const flow: any[][] = valueRanges[1]?.values ?? [];
    const records: any[][] = valueRanges[2]?.values ?? [];
    const sig: any[][] = valueRanges[3]?.values ?? [];

    const idx = listOfSpecies.findIndex((s: any) => s[0] === species);
    
    const output = {
        flow: flow[idx][0],
        records: records[idx][0],
        sig: sig[idx][0]
    };

    return output;
}

export { whichFlow };
