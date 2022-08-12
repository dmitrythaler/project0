import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import themeReducer, { BRANCH as themeBranch } from './theme'
import msgsReducer, { BRANCH as msgsBranch } from './message'
import statusReducer, { BRANCH as statusBranch } from './status'
import coursesReducer, { BRANCH as coursesBranch } from './course'
import usersReducer, { BRANCH as usersBranch } from './user'
import wsReducer, { BRANCH as wsBranch, initWebSocket } from './ws'
import sessionReducer, { BRANCH as sessionBranch, initSessionInfra } from './session'
import eventsReducer, { BRANCH as eventsBranch, subscribe2Events } from './events'
import bulkerReducer, { BRANCH as bulkerBranch } from './bulker'
import configReducer, { BRANCH as configBranch } from './config'


//  ----------------------------------------------------------------------------------------------//


const watcher = _st => {
  console.log('+++ STORE WATCHER: store creation', _st.getState() )

  return next =>
    action => {
      console.log('+++ STORE WATCHER:', action)
      return next(action)
    }
}


//  ---------------------------------
//  redux store
const store = createStore(
  combineReducers({
    [themeBranch]: themeReducer,
    [msgsBranch]: msgsReducer,
    [statusBranch]: statusReducer,
    [coursesBranch]: coursesReducer,
    [usersBranch]: usersReducer,
    [wsBranch]: wsReducer,
    [sessionBranch]: sessionReducer,
    [eventsBranch]: eventsReducer,
    [bulkerBranch]: bulkerReducer,
    [configBranch]: configReducer,

    //  to keep last action in the store
    LAST_ACTION: (state = null, action) => action,
  }),
  applyMiddleware(thunk, watcher)
)

subscribe2Events(store)
initSessionInfra(store)
initWebSocket(store)


//  ---------------------------------
//  subscriptions

// store.subscribe(() => {
//   console.log('+++ SUBSCRIPTION, last action', store.getState().LAST_ACTION)
// })

export default store


