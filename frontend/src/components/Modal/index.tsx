// @ts-ignore
import CloseIcon from '../../assets/feather.inline.icons/x.svg'
import './style.css'

const buttonFooter = (buttons) => {
  if (!buttons || !buttons.length) {
    return null
  }
  return (
    <div className="modal-footer">
      { buttons.map((btn, idx) => {
        const cl = 'btn ml-4' + (btn.className ? ` ${btn.className}` : '')
        return (
          <button key={`modalbtn${idx}`} type="button" className={cl} onClick={btn.onClick}>{btn.caption}</button>
        )
      }) }
    </div>
  )
}

export default function({ visible, header, buttons, onClose, className = '', children, closeOnBackdrop = true }) {
  return !visible ? null : (
    <div className="modal-backdrop" onClick={(closeOnBackdrop &&onClose) || null}>
      <div role="alert" className="flex justify-center items-center w-full h-screen">
        <div className={`modal-main ${className}`} onClick={e => e.stopPropagation()}>

          <div className="modal-header">
            <div className="ml-4 text-2xl font-bold">{header}</div>
            <CloseIcon className="icon w-8 h-8 cursor-pointer" onClick={onClose} />
          </div>

          <div className="modal-body">
            {children}
          </div>

          { buttonFooter(buttons)}
        </div>
      </div>
    </div>
  )
}
