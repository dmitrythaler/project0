import type { AnyAction } from 'redux'

//  ----------------------------------------------------------------------------------------------//

class Stack<T> {
  private storage: T[] = []
  constructor() {}
  push(item: T): void { this.storage.push(item) }
  pop(): T | undefined { return this.storage.pop() }
  top(): T | undefined { return this.storage[this.storage.length - 1] }
  size(): number { return this.storage.length }
}

//  ---------------------------------
export class ActionsStack extends Stack<AnyAction> {
  private static inst_: ActionsStack
  static getInstance = () => ActionsStack.inst_ || (ActionsStack.inst_ = new ActionsStack)
}

export const getStack = ActionsStack.getInstance
