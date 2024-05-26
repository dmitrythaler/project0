import React, { useEffect, useState } from 'react'

import './style.css'

//  ---------------------------------

export const Tab = ({ className, active, target, onClick, children }) => (
  <li
    className={`tab${className ? ' ' + className: ''}${active ? ' active' : ''}`}
    onClick={() => onClick && onClick(target)}
  >
    <button className="tab-button">
      {children}
    </button>
  </li>
)

export const Tabs = ({ className, children, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(children[0].props.target)
  useEffect(() => {
    onTabChange && onTabChange(children[0].props.target)
  }, [])

  const _children = children.map(c => React.cloneElement(c, {
    onClick: t => {
      if (t === activeTab) {
        return
      }
      setActiveTab(t)
      onTabChange && onTabChange(t)
    },
    active: activeTab === c.props.target
  }))

  return (
    <ul className={'tabs' + (className ? ' ' + className : '')} role="tablist" >
      {_children}
    </ul>
  )
}
Tabs.displayName = 'Tabs'

export const TabPane = ({ className, active, children }) => (
  <div className={'tab-pane' + (active ? ' active' : '') + (className ? ' ' + className : '')}>
    {children}
  </div>
)

export const TabContent = ({ activeTab, children }) => {
  const _children = children.map(c => React.cloneElement(c, {
    active: activeTab === c.props.id
  }))

  return (
    <div className="tab-content">
      {_children}
    </div>
  )
}
TabContent.displayName = 'TabContent'

export const TabsContainer = ({ className, children, onTabChange }) => {
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    onTabChange && onTabChange(activeTab)
  }, [activeTab])

  const _children = children.map(c => {
    const props: { onTabChange?: any, activeTab?: any } = c.type.displayName === 'Tabs'
      ? { onTabChange: (t) => setActiveTab(t) }
      : c.type.displayName === 'TabContent'
        ? {  activeTab: activeTab }
        : {}

    return React.cloneElement(c, props)
  })

  return (
    <div className={className}>
      {_children}
    </div>
  )
}



