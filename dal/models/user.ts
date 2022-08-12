import type * as T from 'postgres'
import {
  APIError,
  getHash,
  compare2Hash,
  mapToDBRecord,
  mapFromDBRecord,
  removeUuid,
  validateInput,
  logger
} from '@p0/common'
import type { Keyed } from '@p0/common'
// import { inspect } from 'util'

//  ----------------------------------------------------------------------------------------------//

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  User = 'user',
  Publisher = 'publisher'
  // Zombie = 'zombie'
}

export type Himself = {
  email: string,
  lastName?: string,
  firstName?: string,
  password: string,
  isActive?: boolean,
  role?: UserRole
}

export type DBRecord = Himself & {
  uuid?: string,
  createdAt?: Date,
  updatedAt?: Date | null,
  lastLogin?: Date | null
}

//  utils/pipes

const HIDDENPASSWORD = '********'

const validatePassword = (user: Partial<Himself>): Partial<Himself> => {
  //  TODO: extend this
  if (user.password && user.password.length < 8) {
    throw new APIError(400, 'Too short password provided')
  }
  return user
}

const hashPassword = (user: Partial<Himself>): Partial<Himself> => {
  if (user.password && user.password !== HIDDENPASSWORD) {
    user.password = getHash(user.password)
  } else {
    delete user.password
  }
  return user
}

const hidePassword = (user: Partial<DBRecord>): Partial<DBRecord> => {
  if (user.password) {
    user.password = HIDDENPASSWORD
  }
  return user
}

const setDefaults = (user: Himself): Himself => ({
  isActive: true,
  role: UserRole.Publisher,
  ...user
})

//  ----------------------------------------------------------------------------------------------//
type SqlRecord = Record<string, T.SerializableParameter>

export class UserDAL<Sql extends T.Sql<Keyed>>{
  private readonly sql: Sql
  private readonly tbl: T.Helper<string>

  constructor(sql: Sql) {
    this.sql = sql
    this.tbl = sql('public.user')
  }

  getTableName() {
    return this.tbl
  }

  /**
   * Validate input data and create User
   * @param {User} User user data
   * @returns {Promise<DBRecord>}
   */
  async create(u: Himself): Promise<DBRecord> {
    const record: SqlRecord = mapToDBRecord(
      hashPassword(
        validatePassword(
          setDefaults(
            validateInput(u, ['email', 'firstName', 'lastName', 'password'])
          )
        )
      )
    )

    const [user] = await this.sql`
      insert into ${this.tbl} ${this.sql(record)}
      returning *
    `
    logger.dal('new User successfully created:', hidePassword(user))
    return mapFromDBRecord(
      hidePassword(user)
    )
  }

  /**
   * Retrieves list of Users
   * @returns {Promise<DBRecord[]>}
   */
  async getList(): Promise<DBRecord[]> {
    const users: DBRecord[] = await this.sql`
      select * from ${this.tbl}
    `
    logger.dal(`Users list retrieved, ${users?.length} items`)
    return users.map(u => mapFromDBRecord(hidePassword(u)))
  }

  /**
   * Retrieves User by uuid
   * @param {string} uuid - user's id
   * @returns {Promise<DBRecord>}
   * @throws {APIError(404)} if not found
   */
  async getById(uuid: string): Promise<DBRecord> {
    const [user] = await this.sql`
      select * from ${this.tbl}
      where uuid = ${uuid}
    `
    if (!user) {
      throw new APIError(404, `User with id "${uuid}" not found!`)
    }

    logger.dal('User retrieved by id:', hidePassword(user))
    return mapFromDBRecord(
      hidePassword(user)
    )
  }

  /**
   * Retrieves User by email
   * @param {string} email - user's email
   * @returns {Promise<DBRecord>}
   * @throws {APIError(404)} if not found
   */
  async getByEmail(email: string): Promise<DBRecord> {
    const [user] = await this.sql`select * from ${this.tbl} where email = ${email}`
    if (!user) {
      throw new APIError(404, `User with email "${email}" not found!`)
    }
    logger.dal('User retrieved by email:', hidePassword(user))
    return mapFromDBRecord(
      hidePassword(user)
    )
  }

  /**
   * Update/patch User
   * @param {string} uuid - user id
   * @param {Partial<Himself>} u user data
   * @returns {Promise<DBRecord>}
   */
  async update(uuid: string, u: Partial<Himself>): Promise<DBRecord> {
    const record: SqlRecord = mapToDBRecord(
      removeUuid(
        hashPassword(
          validatePassword(u)
        )
      )
    )

    const [user] = await this.sql`
      update ${this.tbl} set ${this.sql(record)}, "updated_at" = ${this.sql`now()`}
      where uuid = ${uuid}
      returning *
    `
    if (!user) {
      throw new APIError(404, `User with id "${uuid}" not found!`)
    }

    logger.dal('User successfully updated:', hidePassword(user))
    return mapFromDBRecord(hidePassword(user))
  }

  /**
   * login and ppdate User's lastLogin property
   * @param {string} email
   * @param {string} password
   * @returns {Promise<DBRecord>}
   */
  async login(email: string, password: string): Promise<DBRecord> {
    let [user] = await this.sql`
      select password, is_active from ${this.tbl}
      where email = ${email}
    `
    if (!user) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    if (!user.is_active) {
      throw new APIError(403, 'Login failed, user is suspended!')
    }

    if (!compare2Hash(password, user.password as string)) {
      throw new APIError(401, 'Login failed, incorrect creds provided!')
    }

    [user] = await this.sql`
      update ${this.tbl} set "last_login" = ${this.sql`now()`}
      where email = ${email}
      returning *
    `

    logger.dal('User successfully logged in:', hidePassword(user))
    return mapFromDBRecord(
      hidePassword(user)
    )
  }


  /**
   * delete User
   * @param {string} uuid - user id
   * @returns {Promise<void>
   */
  async delete(uuid: string): Promise<void> {
    await this.sql`
      delete from ${this.tbl} where "uuid" = ${uuid}
    `
    logger.dal(`User ${uuid} deleted`)
  }
}

