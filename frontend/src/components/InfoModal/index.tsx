import { useEffect, useRef } from 'react'
import { timeString } from '@common'
import Modal from '@components/Modal'

import { useAppSelector, useAppDispatch } from '@storage'
import { SessionActions, StatusActions, EventsActions } from '@storage'

import './style.css'

//  ---------------------------------

export default ({ visible, onClose }) => {

  const events = useAppSelector(EventsActions.getEvents)
  const dispatch = useAppDispatch()
  const bottomRef = useRef<HTMLDivElement|null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView(/* { behavior: "smooth" } */)
  }, [events, visible])

  const currUser = useAppSelector(SessionActions.getUser)
  if (!currUser) {
    return null
  }

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={true} header="Events"
      buttons={[
        { caption: 'Get Status', className: 'btn-accent', onClick: () => dispatch(StatusActions.fetchAppStatusAction()) },
        { caption: 'Clear', className: 'btn-accent', onClick: () => dispatch(EventsActions.clearEventsAction()) },
        { caption: 'Close', className: 'btn-inverted', onClick: onClose },
      ]}>

      <div className="min-h-[15rem] max-h-[65vh] overflow-auto text-sm">
        {events.map((event, idx) => {
          return (<div key={idx}>
            <span className="text-accent font-bold">{timeString(event.time)}</span>:{' '}
            [<span className="font-bold">{event.type}</span>]
            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </div>)
          })}

        <div ref={bottomRef} />
      </div>
    </Modal>
  )
}
