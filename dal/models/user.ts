import bcrypt from 'bcrypt'
import { BCRYPT_ROUNDS_NUM } from '@p0/common'
import {
  APIError,
  removeProp,
  validateInput,
  logger
} from '@p0/common'
import type { DatabaseClient } from './db-client.ts'

import type * as M from 'mongodb'
import { ObjectId } from 'mongodb'
import type { IndexDefinition } from './db-client.ts'

//  ----------------------------------------------------------------------------------------------//

export type Role = 'Admin' | 'User'
interface _Base {
  email: string,
  lastName?: string,
  firstName?: string,
  password: string,
  isActive: boolean,
  role: Role,
  createdAt?: Date,
  updatedAt?: Date | null,
  lastLogin?: Date | null
}

interface DBRecord extends _Base {
  _id?: M.ObjectId
}

export interface Self extends _Base {
  _id?: string,
}

//  utils/pipes

const HIDDENPASSWORD = ''

const validatePassword = <T extends Partial<Self>>(user: T): T => {
  //  TODO: extend this
  if (!user.password) {
    throw new APIError(400, 'Password not provided')
  }
  if (user.password.length < 8) {
    throw new APIError(400, 'Password is too short')
  }
  return user
}

const validateOrRemovePassword = <T extends Partial<Self>>(user: T): T => {
  if (user.password) {
    return validatePassword(user)
  }
  delete user.password
  return user
}

const hashPassword = <T extends Partial<Self>>(user: T): T => {
  if (user.password && user.password !== HIDDENPASSWORD) {
    user.password = bcrypt.hashSync(user.password, BCRYPT_ROUNDS_NUM)
  }
  return user
}

const hidePassword = <T extends Partial<Self>>(user: T): T => {
  if (user.password) {
    user.password = HIDDENPASSWORD
  }
  return user
}

const setDefaults = <T extends Partial<Self>>(user: T): T => ({
  isActive: true,
  role: 'User',
  ...user
})

const setCreatedAt = <T extends Partial<Self>>(user: T): T => ({
  ...user,
  createdAt: new Date(),
  updatedAt: null,
  lastLogin: null
})

const setUpdatedAt = <T extends Partial<Self>>(user: T): T => ({
  ...user,
  updatedAt: new Date()
})

const convertId = <T extends DBRecord>(user: T): T => {
  if (user._id && typeof user._id !== 'string') {
    return {
      ...user,
      _id: user._id?.toHexString()
    }
  }
  return user
}

const dbRecord2Self = (u: DBRecord): Self => ({
  ...u,
  ...(u._id ? { _id: u._id.toString('hex') } : null),
} as Self)

const self2DBRecord = (u: Self): DBRecord => ({
  ...u,
  ...(u._id ? { _id: new ObjectId(u._id) } : null),
} as DBRecord)

//  ----------------------------------------------------------------------------------------------//

export class UserDAL<Client extends DatabaseClient> {
  private static readonly collName = 'users'
  private static readonly idxDefs: IndexDefinition[] = [{
    spec: { email: 1 },
    options: { unique: true }
  }]
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  async init() {
    await this.client.setupCollection(UserDAL.collName, UserDAL.idxDefs)
  }

  /**
   * Get MongoDB collection "users"
   * it is public only for testing purposes
   * @returns {Promise<M.Collection>}
   */
  async getColl(): Promise<M.Collection<DBRecord>> {
    const db = await this.client.getDb()
    return db.collection<DBRecord>(UserDAL.collName)
  }

  /**
   * Validate input data and create User
   * @param {User} User user data
   * @returns {Promise<DBRecord>}
   */
  async create(u: Self): Promise<Self> {
    let record = hashPassword(
      validatePassword(
        removeProp(
          setCreatedAt(
            setDefaults(
              validateInput(u, ['email', 'firstName', 'lastName', 'password'])
            )
          ),
          '_id'
        )
      )
    )

    try {
      const coll = await this.getColl()
      const res = await coll.insertOne(self2DBRecord(record))
      record = hidePassword({
        ...record,
        _id: res.insertedId.toString('hex')
      })

      logger.dal('new User successfully created:', record)
      return record
    } catch (error) {
      throw ((<M.MongoError>error).code === 11000
        ? new APIError(400, 'A user with the same email already exists.')
        : error
      )
    }
  }

  /**
   * Retrieves list of Users
   * @returns {Promise<Self[]>}
   */
  async getList(): Promise<Self[]> {
    const coll = await this.getColl()
    const users: DBRecord[] = await coll.find<DBRecord>({}).toArray()
    logger.dal(`Users list retrieved, ${users?.length} items`)
    return users.map(dbRecord2Self).map(hidePassword)
  }

  /**
   * Retrieves User by id
   * @param {string} _id - user's id
   * @returns {Promise<Self>}
   * @throws {APIError(404)} if not found
   */
  async getById(_id: string): Promise<Self> {
    const coll = await this.getColl()
    const record = await coll.findOne({ _id: new ObjectId(_id) }) as DBRecord

    if (!record) {
      throw new APIError(404, `User with id "${_id}" not found!`)
    }

    const user = hidePassword(dbRecord2Self(record))
    logger.dal('User retrieved by id:', user)
    return user
  }

  /**
   * Retrieves User by email
   * @param {string} email - user's email
   * @returns {Promise<Self>}
   * @throws {APIError(404)} if not found
   */
  async getByEmail(email: string): Promise<Self> {
    const coll = await this.getColl()
    const record = await coll.findOne({ email }) as DBRecord

    if (!record) {
      throw new APIError(404, `User with email "${email}" not found!`)
    }

    const user = hidePassword(dbRecord2Self(record))
    logger.dal('User retrieved by id:', user)
    return user
  }

  /**
   * Update/patch User
   * @param {string} _id - user id
   * @param {Partial<Self>} u user data
   * @returns {Promise<Self>}
   */
  async update(_id: string, u: Partial<Self>): Promise<Self> {
    const record = setUpdatedAt(
      removeProp(
        hashPassword(
          validateOrRemovePassword(u)
        ) as Self,
        '_id'
      )
    )

    const coll = await this.getColl()
    let res: M.UpdateResult
    try {
      res = await coll.updateOne({ _id: new ObjectId(_id) }, { $set: self2DBRecord(record) })
    } catch (error) {
      throw ((<M.MongoError>error).code === 11000
        ? new APIError(400, 'A user with the same email already exists.')
        : error
      )
    }

    if (!res.modifiedCount) {
      throw new APIError(404, `User with id "${_id}" not found!`)
    }

    const user = await this.getById(_id)
    logger.dal('User successfully updated:', user)
    return user
  }

  /**
   * login and ppdate User's lastLogin property
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Self>}
   */
  async login(email: string, password: string): Promise<Self> {
    const coll = await this.getColl()
    const record = (await coll.findOne({ email }) as DBRecord)

    if (!record) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    const user = dbRecord2Self(record)
    if (!user.isActive) {
      throw new APIError(403, 'Login failed, user is suspended!')
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    const now = new Date()
    await coll.updateOne({ email }, { $set: { lastLogin: now } })

    logger.dal(`User with "${email}" successfully logged in.`)
    return hidePassword({
      ...user,
      lastLogin: now
    })
  }


  /**
   * delete User
   * @param {string} _id - user's id'
   * @returns {Promise<void>
   */
  async delete(_id: string): Promise<void> {
    const coll = await this.getColl()
    const res: M.DeleteResult = await coll.deleteOne({ _id: new ObjectId(_id) })
    if (!res.deletedCount) {
      throw new APIError(404, `User with id "${_id}" not found!`)
    }
    logger.dal(`User with id "${_id}" deleted`)
  }
}

