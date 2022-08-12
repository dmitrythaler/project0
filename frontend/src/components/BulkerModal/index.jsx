import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from "react-redux"

import Modal from '@components/Modal'
import {
  TabsContainer,
  Tabs,
  Tab,
  TabContent,
  TabPane
} from '@components/Tabs'
import RuleForm from './ruleForm'
import RulesTable from './rulesTable'

import {
  getRules,
  getLog,
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
  applyRule,
  clearLog
} from '@storage/bulker'

// import { ReactComponent as PublishIcon } from '@assets/feather.inline.icons/external-link.svg'
import './style.css'

//  ---------------------------------
const newRule = {
  name: 'New Rule',
  courseId: null,
  testPath: '',
  testFunc: '',
  updatePath: '',
  updateFunc: ''
}

export default ({ visible, courseId, courseName, onClose }) => {

  const ruleFormRef = useRef()
  const bottomRef = useRef()

  const dispatch = useDispatch()
  const _rules = useSelector(getRules)
  const log = useSelector(getLog)

  const [rules, setRules] = useState([])
  const [currRule, setCurrRule] = useState(newRule)
  const [currTab, setCurrTab] = useState('')

  useEffect(() => {
    if (courseId) {
      dispatch(fetchRules(courseId))
    }
  }, [courseId])

  useEffect(() => {
    setRules([
      ..._rules,
      {
        ...newRule,
        courseId
      }
    ])
  }, [_rules])

  useEffect(() => {
    setCurrRule(rules[0])
  }, [rules])

  //  ---------------------------------
  const onSaveRule = () => {
    if (ruleFormRef.current.validateBeforeSave(currRule)) {
      if (currRule.uuid) {
        dispatch(updateRule(currRule))
      } else {
        dispatch(createRule(currRule))
      }
    }
  }

  const onApplyRule = (dry = false) => {
    if (currRule.uuid) {
      dispatch(applyRule(currRule, dry))
    }
  }

  const onDeleteRule = () => {
    if (currRule.uuid) {
      dispatch(deleteRule(currRule))
    }
  }

  const onTabChange = (tab) => {
    setCurrTab(tab)
    if (tab === 'log') {
      bottomRef.current?.scrollIntoView()
    }
  }

  const onClearLog = () => {
    dispatch(clearLog())
  }

  //  ---------------------------------

  let buttons
  if (currTab === 'log') {
    buttons = [
      { caption: 'Clear Log', className: 'btn-accent', onClick: onClearLog },
      { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
    ]
  } else if (currRule?.uuid) {
    if (currRule.updatePath && currRule.updateFunc) {
      buttons = [
        { caption: 'Run Update', className: 'ml-0 btn-accent', onClick: () => onApplyRule(false) },
        { caption: 'Dry run', className: 'btn-accent mr-auto', onClick: () => onApplyRule(true) },
        { caption: 'Delete', className: 'btn-accent', onClick: onDeleteRule },
        { caption: 'Save', className: 'btn-accent', onClick: onSaveRule },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]
    }
    else {
      buttons = [
        { caption: 'Run Test', className: 'ml-0 btn-accent mr-auto', onClick: () => onApplyRule(false) },
        { caption: 'Delete', className: 'btn-accent', onClick: onDeleteRule },
        { caption: 'Save', className: 'btn-accent', onClick: onSaveRule },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]
    }
  } else {
    buttons = [
      { caption: 'Save', className: 'btn-accent', onClick: onSaveRule },
      { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
    ]
  }

  return (
    <Modal
      className="bigger"
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      header={`Operate with Test/Update Rules (${courseName})`}
      buttons={buttons}
    >

      <TabsContainer className="min-h-[40rem] mt-[-1rem]" onTabChange={onTabChange} >
        <Tabs key="tabs" className="mb-2 ml-auto">
          <Tab target="rule" key="rule">Rule</Tab>
          <Tab target="log" key="log">Log</Tab>
        </Tabs>

        <TabContent key="content" className="mt-4">
          <TabPane id="rule" key="rule">

            <div className="grid gap-4 lg:grid-cols-4 mb-4">
              <div className="lg:col-span-1">
                <RulesTable
                  rules={rules}
                  currRule={currRule}
                  onRuleClick={r => setCurrRule(r)}
                />
              </div>

              <div className="lg:col-span-3">
                <RuleForm ref={ruleFormRef} rule={currRule} />
              </div>
            </div>

          </TabPane>
          <TabPane id="log" key="log" className="min-h-[35rem] max-h-[55vh] overflow-auto text-sm border border-neutral-500/50 w-full">
            <pre className="p-2">
              {log}
            </pre>
            <div ref={bottomRef} />
          </TabPane>
        </TabContent>
      </TabsContainer>

    </Modal>
  )
}
