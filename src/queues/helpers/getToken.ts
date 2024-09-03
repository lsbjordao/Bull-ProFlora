import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config()

async function getToken(source: string) {

    const config: any = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    let body = {}
    if(source === 'CNCFlora-ProFlora'){
        body = {
            "grant_type": "password",
            "username": "lucasjordao@jbrj.gov.br",
            "password": "-FWst_aJDN06",
            "client_id": "cncflora_api",
            "client_secret": "05Mb14$28_&tr"
        }
    }
    if(source === 'Museu-Goeldi/PA'){
        body = {
            "grant_type": "password",
            "username": "admin@museugoeldi",
            "password": "user2023Para$",
            "client_id": "cncflora_api",
            "client_secret": "05Mb14$28_&tr"
        }
    }

    let urlBase = process.env.ProFloraUrlBaseProd
    const env = process.env.NODE_ENV
    if (env === 'dev') { urlBase = process.env.ProFloraUrlBaseDev }

    const endpoint_oath = `${urlBase}/oauth`;

    const token = await axios.post(endpoint_oath, body, config)
        .then(response => {
            return response.data.access_token
        })
        .catch(error => {
            console.error('Error getting token:', error);
        })

    return token
}

export { getToken }