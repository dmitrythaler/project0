import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import App from '@containers/App'
import { store } from '@storage'
import './style.css'

declare const SHARED_CONF__PRODUCTION: boolean

//  ---------------------------------
//  render

const rootEl = document.getElementById('app')
if (!rootEl) {
  throw Error('Element with id "app" not found!')
}
const appRoot = ReactDOM.createRoot(rootEl)
//

const render = () => appRoot.render((
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
))


render()

if (!SHARED_CONF__PRODUCTION) {
  const sse = new EventSource('/dev-server')
  sse.addEventListener('message', (msg) => {
    console.log('DEV-SERVER: message', msg?.data)
  })
  sse.addEventListener('update', (msg) => {
    console.log('DEV-SERVER: update', msg?.data)
    location.reload()
  })
  sse.addEventListener('error', (msg) => {
    console.error('DEV-SERVER: error', msg)
  })
  sse.addEventListener('open', (msg) => {
    console.log('DEV-SERVER: open', msg)
  })
}

