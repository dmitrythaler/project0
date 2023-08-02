import {
  THEME_BRANCH as BRANCH,
  THEME_CHANGE,
  ACCENT_CHANGE,
} from '@p0/common/constants'


import type { ThemeData } from '../reducers/theme'
import type { RootState } from '../store'

//  ----------------------------------------------------------------------------------------------//
//  action creators

export const changeThemeAction = (theme: string) => ({ type: THEME_CHANGE, payload: { theme } })
export const changeAccentAction = (accent: string) => ({ type: ACCENT_CHANGE, payload: { accent } })

//  ---------------------------------
//  selectors

export const getTheme = (state: RootState): ThemeData => state[BRANCH]


