import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';

async function whichFlow(species: string): Promise<any> {
    
    const keyPath = './credentials.json';
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ];

    const credentials = new JWT({
        keyFile: keyPath,
        scopes: scopes,
    });

    await credentials.authorize();

    const sheets = google.sheets({ version: 'v4', auth: credentials });
    const spreadsheetId = '1DwBS0VD79wMO0UNztfSbUR5mTYdlv3rX9Se1bZhV4Jg';
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
