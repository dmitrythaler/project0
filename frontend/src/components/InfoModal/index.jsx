import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from "react-redux"
import Modal from '@components/Modal'

import { getUser } from '@storage/session'
import { fetchAppStatus } from '@storage/status'
import { getEvents, clearEvents } from '@storage/events'

import './style.css'

//  ---------------------------------

export default ({ visible, onClose }) => {

  const events = useSelector(getEvents)
  const dispatch = useDispatch()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView(/* { behavior: "smooth" } */)
  }, [events, visible])

  const currUser = useSelector(getUser)
  if (!currUser) {
    return null
  }

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={true} header="Events"
      buttons={[
        { caption: 'Get Status', className: 'btn-accent', onClick: () => dispatch(fetchAppStatus()) },
        { caption: 'Clear', className: 'btn-accent', onClick: () => dispatch(clearEvents()) },
        { caption: 'Close', className: 'btn-inverted', onClick: onClose },
      ]}>

      <div className="min-h-[15rem] max-h-[65vh] overflow-auto text-sm">
        {events.map((event, idx) => {
          return (<div key={idx}>
            <span className="text-accent font-bold">{event.time.toISOString().slice(0, -5).replace('T', ' ')}</span>:{' '}
            [<span className="font-bold">{event.title || event.event}</span>]
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </div>)
          })}

        <div ref={bottomRef} />
      </div>
    </Modal>
  )
}
