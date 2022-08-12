import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// import { createStore } from 'redux'
import { Provider } from 'react-redux'

import store from '@storage'
import App from '@containers/App'

import './style.css'

//  ---------------------------------
//  render

const rootEl = document.getElementById('app')
const appRoot = ReactDOM.createRoot(rootEl)

const render = () => {
  return appRoot.render((
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    ))
  }

render()


//  ---------------------------------
//  hmr

if (import.meta.hot) {
  import.meta.hot.accept(render)
}

// if (import.meta.hot) {
//   console.info('[HMR] active')

//   import.meta.hot.accept([
//     './components/Header/index.jsx',
//     './containers/App/index.jsx',
//   ], (modules) => {
//     console.info('[HMR] accepting updates, rendering ...', modules)
//     // console.log('[HMR] module', appModule)
//     render()
//   })
// }
