import { useState } from 'react'
import { Link, useLocation } from "react-router-dom"

import { useAppSelector, useAppDispatch, ThemeActions } from '@storage'

// @ts-ignore
import ProjectLogo from '../../assets/feather.inline.icons/book-open.svg'
// @ts-ignore
import UsersIcon from '../../assets/feather.inline.icons/users.svg'
// @ts-ignore
import MediaIcon from '../../assets/feather.inline.icons/image.svg'
// @ts-ignore
import ArrowIcon from '../../assets/feather.inline.icons/arrow-up-circle.svg'
// @ts-ignore
import PaintIcon from '../../assets/feather.inline.icons/eye.svg'
// @ts-ignore
import MoonIcon from '../../assets/feather.inline.icons/moon.svg'
// @ts-ignore
import SunIcon from '../../assets/feather.inline.icons/sun.svg'

import './style.css'

export default function ({ currUser }) {

  const dispatch = useAppDispatch()
  const { pathname } = useLocation()
  const theme = useAppSelector(ThemeActions.getTheme)
  const [themeMenuVisible, showThemeMenu] = useState(false)

  //  ---------------------------------
  let leaveTimeout: NodeJS.Timeout|number = 0

  const themeSetter = () => {
    dispatch(ThemeActions.changeThemeAction(theme.theme === 'light' ? 'dark' : 'light'))
  }

  const accentSetter = newAccent => {
    dispatch(ThemeActions.changeAccentAction(newAccent))
  }

  const leaveHandler = e => {
    e.stopPropagation()
    leaveTimeout = setTimeout(() => {
      showThemeMenu(false)
    }, 1000)
  }

  const enterHandler = e => {
    e.stopPropagation()
    clearTimeout(leaveTimeout)
    leaveTimeout = 0
  }

  const themeBtnClickHandler = e => {
    e.stopPropagation()
    showThemeMenu(!themeMenuVisible)
  }

  const clName = a => 'hover:bg-accent hover:text-accent-text' +
    (a ? ' text-accent-text bg-accent-dark' : '')

  const adminMode = currUser && currUser.role === 'Admin'

  return (
    <div className="main-sidebar-background" >
      <div className="main-sidebar">
        <div className={clName(pathname === '/')}>
          <Link className="block py-3" to="/">
            <ProjectLogo className="w-16 h-16 mx-auto" />
          </Link>
        </div>

        {currUser ? (
          <div className={clName(pathname === '/media')}>
            <Link className="block py-3" to="/media">
              <MediaIcon className="w-16 h-16 icon mx-auto" />
            </Link>
          </div>
        ) : null}

        {adminMode ? (
          <div className={clName(pathname === '/users')}>
            <Link className="block py-3" to="/users">
              <UsersIcon className="w-16 h-16 icon mx-auto" />
            </Link>
          </div>
        ) : null}

        <div
          className="py-3 hover:bg-accent hover:text-accent-text mt-auto"
          onClick={themeBtnClickHandler}
          onMouseEnter={enterHandler}
          onMouseLeave={leaveHandler}
        >
          <PaintIcon className="w-16 h-16 icon mx-auto" />
        </div>

        <div className="py-3 hover:bg-accent hover:text-accent-text">
          <ArrowIcon className="w-16 h-16 icon mx-auto" />
        </div>

      </div>

      <div className={`config-sidebar ${themeMenuVisible ? 'active' : ''}`} onMouseEnter={enterHandler} onMouseLeave={leaveHandler}>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('gray')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-gray-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('green')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-green-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('orange')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-orange-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('indigo')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-indigo-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('teal')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-teal-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('blue')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-blue-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text" onClick={() => accentSetter('purple')}>
          <div className="w-10 h-10 mx-auto border-2 border-current rounded-md bg-purple-500" />
        </div>
        <div className="py-3 hover:bg-accent hover:text-accent-text text-center border-t subtle-border" onClick={themeSetter} >
          {theme.theme === 'light'
            ? (<SunIcon className="w-12 h-12 icon mx-auto" />)
            : (<MoonIcon className="w-12 h-12 icon mx-auto" />)
          }
        </div>
      </div>

    </div>
  )
}
