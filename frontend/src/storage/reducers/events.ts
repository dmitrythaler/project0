import {
  EVENTS_ADD,
  EVENTS_CLEAR
} from '@p0/common/constants'

import type { AnyAction } from 'redux'
import type { AppActionExt } from '@common/types'

//  ----------------------------------------------------------------------------------------------//

export const reducer = (state: AppActionExt[] = [], action: AnyAction): AppActionExt[] => {
  switch (action.type) {
    case EVENTS_ADD: {
      return [
        ...state,
        {
          ...action.payload,
          time: new Date()
        } as AppActionExt
      ]
    }

    case EVENTS_CLEAR: {
      return []
    }

    default:
      return state
  }
}

