// @ts-ignore
import CloseIcon from '../../assets/feather.inline.icons/x.svg'

import { useAppSelector, useAppDispatch, MessagesState } from '@storage';
import './style.css';

export default () => {
  const messages = useAppSelector(MessagesState.getMessages);
  const dispatch = useAppDispatch();

  return  (
    <div className='message-hub'>
      {messages ? messages.map(msg => (
        <div
          className='message-box'
          key={msg.id}
        >
          <div className="flex flex-row justify-between items-center border-b border-accent px-3 py-2">
            <div className="ml-4 text-2xl font-bold">{msg.header}</div>
            <CloseIcon className="icon w-8 h-8 cursor-pointer" onClick={() => dispatch(MessagesState.deleteMessageAction(msg.id!))} />
          </div>

          <div className="px-10 py-5">
            {msg.body}
          </div>
        </div>
      )) : null}
    </div>
  );
}
