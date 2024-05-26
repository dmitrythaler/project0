import {
  THEME_BRANCH as BRANCH,
} from '@p0/common/constants'

import type { ThemeData } from '../reducers/theme'
import type { AppState } from '../store'

export * from '../reducers/theme'

//  ---------------------------------
// selectors
export const getTheme = (state: AppState): ThemeData => state[BRANCH]
