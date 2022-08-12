import axios from 'axios'

//  SHARED_CONF_.. constants defined with Vite
const conf = {
  api: {
    // globally defined consts below
    port: SHARED_CONF__API_PORT,
    wsPort: SHARED_CONF__WS_PORT,
    version: SHARED_CONF__API_VERSION
  }
}

export default conf

conf.hostname = window.location.hostname
conf.protocol = window.location.protocol
conf.wsProtocol = conf.protocol === 'https:' ? 'wss:' : 'ws:'
conf.baseURL = `${conf.protocol}//${conf.hostname}:${conf.api.port}/api/${conf.api.version}/`

export const apiInstance = axios.create({
  baseURL: conf.baseURL,
  withCredentials: true,
  responseType: 'json'
})
