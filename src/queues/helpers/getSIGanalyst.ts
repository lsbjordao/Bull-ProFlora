import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
dotenv.config();

async function getSIGanalyst(species: string, source: 'CNCFlora-oldSystem' | 'CNCFlora-ProFlora' | 'Museu-Goeldi/PA'): Promise<any> {
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
    } else if (source === 'CNCFlora-ProFlora') {
        spreadsheetId = process.env.SPREADSHEET_ID_CNCFLORA_PROFLORA!;
    } else if (source === 'Museu-Goeldi/PA') {
        spreadsheetId = process.env.SPREADSHEET_ID_MUSEU_GOELDI!;
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

    return (SIGanalyst[idx] !== undefined) ? SIGanalyst[idx][0] : 'SIG analyst not found';
}

export { getSIGanalyst };
