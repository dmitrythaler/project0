import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from "react-redux"

import { getConfig, fetchConfig, updateConfig } from '@storage/config'

import Modal from '@components/Modal'

import './style.css'

//  ---------------------------------

export default ({ visible, onClose }) => {

  const defaultConfig = {
    cronString: '',
    logRecipients: '',
    deleteNulls: true,
    deleteEmptyStrings: false,
    deleteEmptyArrays: false
  }

  const dispatch = useDispatch()
  const cfg = useSelector(getConfig)

  const [currConfig, setCurrConfig] = useState(defaultConfig)
  const [validationError, setValidationError] = useState({})

  useEffect(() => {
    setCurrConfig(cfg || defaultConfig)
  }, [cfg])

  useEffect(() => {
    dispatch(fetchConfig())
  }, [])

  const onChange = e => {
    setCurrConfig({
      ...currConfig,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const validateBeforeSave = () => {
    let error = false
    const ve = {}
    if (!currConfig.logRecipients) {
      ve.logRecipients = true
      error = true
    }
    console.log('+++ validateBeforeSave', currConfig, ve)

    if (!error) {
      dispatch(updateConfig(currConfig))
    } else {
      setValidationError(ve)
      setTimeout(() => {
        setValidationError({})
      }, 700)

    }
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} header="Update Config" className=""
      buttons={[
        { caption: 'Update', className: 'btn-accent', onClick: validateBeforeSave },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]}>

      <form>
        <div>
          <label htmlFor="logRecipients" className="">Log Recipients</label>
          <input type="text" id="logRecipients" name="logRecipients" onChange={onChange} value={currConfig.logRecipients}
            className={`app-input ${hasError('logRecipients')}`} placeholder="* Required! Log Recipients' email comma-separated list"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="cronString" >Cron Init String</label>
          <input type="text" id="cronString" name="cronString" onChange={onChange} value={currConfig.cronString}
            className="app-input" placeholder="Cron initialization string"
          />
        </div>

        <hr className="border-t border-neutral-500/50 mt-4" />
        <h3 className="text-lg mt-4 mb-2 font-bold w-full border-b border-accent">Data Transformation parameters:</h3>

        <div className="grid gap-4 lg:grid-cols-6">

          <div className="lg:col-span-2">
            <div className="w-full">
              <label htmlFor="deleteNulls" className="">Delete Nulls</label>
            </div>
            <div className="w-full flex flex-row justify-start items-center h-10">
              <input id="deleteNulls" name="deleteNulls" type="checkbox" onChange={onChange} checked={currConfig.deleteNulls}
                className="w-6 h-6"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="w-full">
              <label htmlFor="deleteEmptyStrings" className="">Delete Empty Strings</label>
            </div>
            <div className="w-full flex flex-row justify-start items-center h-10">
              <input id="deleteEmptyStrings" name="deleteEmptyStrings" type="checkbox" onChange={onChange} checked={currConfig.deleteEmptyStrings}
                className="w-6 h-6"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="w-full">
              <label htmlFor="deleteEmptyArrays" className="">Delete Empty Arrays</label>
            </div>
            <div className="w-full flex flex-row justify-start items-center h-10">
              <input id="deleteEmptyArrays" name="deleteEmptyArrays" type="checkbox" onChange={onChange} checked={currConfig.deleteEmptyArrays}
                className="w-6 h-6"
              />
            </div>
          </div>


        </div>
      </form>

    </Modal>
  )
}
