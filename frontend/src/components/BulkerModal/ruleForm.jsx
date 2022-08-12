import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

import './style.css'

//  ---------------------------------

const RuleForm = ({ rule }, ref) => {

  const [currRule, setCurrRule] = useState(rule)
  const [validationError, setValidationError] = useState({})

  useEffect(() => {
    setCurrRule(rule)
  }, [rule])

  useImperativeHandle(ref, () => ({
    validateBeforeSave(rule) {
      let error = false

      const ve = {}
      if (!rule.name) {
        ve.name = true
        error = true
      }
      if (!rule.testPath) {
        ve.testPath = true
        error = true
      }
      if (!rule.testFunc) {
        ve.testFunc = true
        error = true
      }

      if (error) {
        setValidationError(ve)
        setTimeout(() => {
          setValidationError({})
        }, 700)
      }

      return !error
    }
  }), [])

  const onChange = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setCurrRule({
      ...currRule,
      [e.target.name]: val
    })
    rule[e.target.name] = val
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <div>
      <form>
        <div className="grid gap-4 lg:grid-cols-6 mb-4">

          <div className="mb-4 lg:col-span-5">
            <label htmlFor="name" className="">Name</label>
            <input type="text" id="name" name="name" onChange={onChange} value={currRule.name}
              className={`app-input ${hasError('name')}`} placeholder="* Required! Name of the Rule"
            />
          </div>

          <div className="lg:col-span-1">
            <div className="w-full">
              <label htmlFor="runByCron" className="">By Cron</label>
            </div>
            <div className="w-full flex justify-center items-center h-10">
              <input id="runByCron" name="runByCron" type="checkbox" onChange={onChange} checked={currRule.runByCron}
                className="w-6 h-6 mx-auto"
              />
            </div>
          </div>

        </div>

        <div className="mb-4">
          <label htmlFor="testPath" className="">Test Path</label>
          <input type="text" min="1" id="testPath" name="testPath" onChange={onChange} value={currRule.testPath}
            className={`app-input ${hasError('testPath')}`} placeholder="* Required! Path to test/filter"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="testFunc" className="">Test Func</label>
          <pre className="func-wrap begin">{'function($node, $log, $path) {'}</pre>
          <textarea
            id="testFunc"
            name="testFunc"
            onChange={onChange}
            value={currRule.testFunc}
            className={`func-body ${hasError('testFunc')}`}
            placeholder="* Required! Function to check paths"
          />
          <pre className="func-wrap end">{'}'}</pre>
        </div>

        <div className="mb-4">
          <label htmlFor="updatePath" className="">Update Path</label>
          <input type="text" min="1" id="updatePath" name="updatePath" onChange={onChange} value={currRule.updatePath}
            className="app-input" placeholder="Path to find withing already tested/filtered paths"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="updateFunc" className="">Update Func</label>
          <pre className="func-wrap begin">{'function($node, $log, $path) {'}</pre>
          <textarea
            id="updateFunc"
            name="updateFunc"
            onChange={onChange}
            value={currRule.updateFunc}
            className="func-body"
            placeholder="Function to apply to found nodes"
          />
          <pre className="func-wrap end">{'}'}</pre>
        </div>

      </form>
    </div>
  )
}

export default forwardRef(RuleForm)
