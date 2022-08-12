export const BRANCH = 'THEME'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const THEME_CHANGE = 'THEME/CHANGE'
export const ACCENT_CHANGE = 'THEME/ACCENT_CHANGE'
export function changeTheme(theme) {
  return {
    type: THEME_CHANGE,
    payload: { theme }
  }
}

export function changeAccent(accent) {
  return {
    type: ACCENT_CHANGE,
    payload: { accent }
  }
}

//  ---------------------------------
//  selectors

export function getTheme(state) {
  return state[BRANCH]
}


//  ----------------------------------------------------------------------------------------------//
//  redicer

const LS_ITEM = BRANCH + '_DATA'
const defaultState = {
  theme: 'dark',
  accent: 'green'
}

export const loadState = () => {
  let data = localStorage.getItem(LS_ITEM)
  const state = (data && JSON.parse(data)) || defaultState
  document.documentElement.setAttribute('data-theme', state.theme)
  document.documentElement.setAttribute('data-accent', state.accent)
  return state
}

export const saveThemeStateToLocalStorage = state => {
  localStorage.setItem(LS_ITEM, JSON.stringify(state[BRANCH]))
}

export default function reducer(state = loadState(), action) {
  switch (action.type) {
    case THEME_CHANGE: {
      console.log('THEME_CHANGE to', action.payload.theme)

      document.documentElement.setAttribute('data-theme', action.payload.theme)
      const newState = {
        ...state,
        theme: action.payload.theme
      }
      localStorage.setItem(LS_ITEM, JSON.stringify(newState))
      return newState
    }

    case ACCENT_CHANGE: {
      document.documentElement.setAttribute('data-accent', action.payload.accent)
      const newState = {
        ...state,
        accent: action.payload.accent
      }
      localStorage.setItem(LS_ITEM, JSON.stringify(newState))
      return newState
    }

    default:
      return state
  }
}

