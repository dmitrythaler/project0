import { apiInstance } from '../config'
import { sendMsg } from './message'

export const BRANCH = 'BULKER'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const RULES_FETCH = 'RULES/FETCH'
export const RULES_LOADED = 'RULES/LOADED'
export const RULES_SCHEDULED_START = 'RULES/SCHEDULED/START'
export const RULES_SCHEDULED_STARTED = 'RULES/SCHEDULED/STARTED'
export const RULES_ERROR = 'RULES/ERROR'
export const RULES_LOG_CLEAR = 'RULES/LOG/CLEAR'
export const RULE_CREATE = 'RULE/CREATE'
export const RULE_CREATED = 'RULE/CREATED'
export const RULE_UPDATE = 'RULE/UPDATE'
export const RULE_UPDATED = 'RULE/UPDATED'
export const RULE_DELETE = 'RULE/DELETE'
export const RULE_DELETED = 'RULE/DELETED'
export const RULE_APPLY = 'RULE/APPLY'
export const RULE_APPLIED = 'RULE/APPLIED'
export const RULE_ERROR = 'RULE/ERROR'

//  ---------------------------------
//  selectors

export function getRules(state) {
  return state[BRANCH].rules
}

export function getLog(state) {
  return state[BRANCH].log
}

export function getRequestStatus(state) {
  return state[BRANCH].status
}

export function getRulesLoading(state) {
  return state[BRANCH].status === RULES_FETCH
}

export function getLastRequestError(state) {
  if(state[BRANCH].status !== RULE_ERROR && state[BRANCH].status !== RULES_ERROR) {
    return null
  }
  const err = state[BRANCH].error
  return err.response?.data || err.response || err
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

const sendErrorMsg = err => {
  const data = err.response.data || err.response || err
  return sendMsg({
    header: 'Update Rule Operation error',
    body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
    timeout: 0
  })
}

//  ---------------------------------

export function fetchRules(courseId) {
  return async dispatch => {
    dispatch({
      type: RULES_FETCH,
      payload: courseId
    })

    try {
      const resp = await apiInstance.get('/bulker/list/' + courseId)
      dispatch({
        type: RULES_LOADED,
        payload: resp.data.rules
      })
    } catch(err) {
      dispatch({ type: RULES_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function createRule(rule) {
  return async dispatch => {
    dispatch({
      type: RULE_CREATE
    })

    try {
      const { courseId, name, testPath, testFunc, updatePath, updateFunc, runByCron } = rule
      const resp = await apiInstance.post('/bulker', {
        data: {
          name, courseId, testPath, testFunc, updatePath, updateFunc, runByCron
        }
      })
      dispatch({
        type: RULE_CREATED,
        payload: resp.data.rule
      })
      dispatch(sendMsg(`The rule(${name}) created.`))
    } catch(err) {
      dispatch({ type: RULE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function updateRule(rule) {
  return async dispatch => {
    dispatch({
      type: RULE_UPDATE
    })

    try {
      const { name, testPath, testFunc, updatePath, updateFunc, runByCron } = rule
      const resp = await apiInstance.patch(`/bulker/${rule.uuid}`, {
        data: {
          name, testPath, testFunc, updatePath, updateFunc, runByCron
        }
      })
      dispatch({
        type: RULE_UPDATED,
        payload: resp.data.rule
      })
      dispatch(sendMsg(`The rule(${name}) updated.`))

    } catch(err) {
      dispatch({ type: RULE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function deleteRule(rule) {
  return async dispatch => {
    dispatch({
      type: RULE_DELETE
    })

    try {
      await apiInstance.delete(`/bulker/${rule.uuid}`)
      dispatch({
        type: RULE_DELETED,
        payload: rule.uuid
      })
      dispatch(sendMsg(`The rule(${rule.name}) deleted.`))
    } catch(err) {
      dispatch({ type: RULE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function applyRule(rule, dry = true) {
  return async dispatch => {
    dispatch({
      type: RULE_APPLY
    })
    dispatch(sendMsg(`Application of the rule(${rule.name}) started.`))

    try {
      const resp = await apiInstance.patch(`/bulker/apply/${rule.uuid}`, {
        data: { dry }
      })
      dispatch({
        type: RULE_APPLIED,
        payload: {
          rule: rule,
          log: resp.data.log
        }
      })
      dispatch(sendMsg(`The rule(${rule.name}) applied.`))
    } catch(err) {
      dispatch({ type: RULE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function runScheduledTests() {
  return async dispatch => {
    dispatch({
      type: RULES_SCHEDULED_START
    })

    try {
      await apiInstance.patch(`/bulker/apply-scheduled`)
      dispatch({
        type: RULES_SCHEDULED_STARTED
      })
    } catch(err) {
      dispatch({ type: RULE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export const clearLog = () => ({ type: RULES_LOG_CLEAR })


//  ----------------------------------------------------------------------------------------------//
//  redicer
const initialState = {
  status: '',
  error: null,
  courseId: null,
  rules: [],
  log: ''
}

export default function reducer(state = initialState, action) {
  switch (action.type) {

    case RULE_CREATE:
    case RULE_UPDATE:
    case RULE_DELETE:
    case RULE_APPLY:
    case RULES_SCHEDULED_START:
    case RULES_SCHEDULED_STARTED: {
      return {
        ...state,
        status: action.type
      }
    }

    case RULES_FETCH: {
      return {
        ...state,
        status: action.type,
        courseId: action.payload
      }
    }

    case RULES_LOADED: {
      return {
        ...state,
        status: action.type,
        rules: action.payload
      }
    }

    case RULES_ERROR: {
      return {
        ...state,
        status: action.type,
        error: action.payload,
        rules: []
      }
    }

    case RULES_LOG_CLEAR: {
      return {
        ...state,
        status: action.type,
        log: ''
      }
    }

    case RULE_CREATED: {
      return {
        ...state,
        status: action.type,
        rules: [ ...state.rules, action.payload]
      }
    }

    case RULE_DELETED: {
      const rules = [...state.rules]
      const idx = rules.findIndex(c => c.uuid === action.payload)
      if (idx !== -1) {
        rules.splice(idx, 1)
      } else {
        console.error('RULE_DELETED, something stupid: rule not found', action.payload)
      }
      return {
        ...state,
        status: action.type,
        rules
      }
    }

    case RULE_APPLIED: {
      return {
        ...state,
        status: action.type,
        log: state.log +
          `\nRule (${action.payload.rule.name}) applied:` +
          action.payload.log
      }
    }

    case RULE_ERROR: {
      return {
        ...state,
        status: action.type,
        error: action.payload
      }
    }

    default:
      return state
  }
}

