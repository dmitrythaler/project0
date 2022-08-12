import type * as T from 'postgres'
import postgres from 'postgres'
import {
  APIError,
  mapToDBRecord,
  anyMapper,
  mapFromDBRecord,
  removeUuid,
  validateInput,
  logger,
  ColorLevel
} from '@p0/common'
import type { Keyed } from '@p0/common'
// import { inspect } from 'util'

//  ----------------------------------------------------------------------------------------------//

export type Itself = {
  name: string,
  prefix?: string,
  squidexId: string,
  squidexSecret: string,
  squidexAuthState?: ColorLevel,
  version?: number,
  publishedAt?: Date | null,
  sincePublished?: any,
  s3Folder?: string | null,
}

export type DBRecord = Itself & {
  uuid?: string,
  createdAt?: Date,
  updatedAt?: Date | null
}

//  utils/pipes

const setDefaults = (course: Itself): Itself => ({
  prefix: '',
  version: 1,
  squidexAuthState: ColorLevel.RED,
  s3Folder: course.name,
  ...course
})

const hideSecret = (course: T.Row): T.Row => ({
  ...course,
  squidex_secret: course.squidex_secret && '*'.repeat(course.squidex_secret.length)
})

const courseToDBRecord = (course: Partial<Itself>): SqlRecord =>
  anyMapper(mapToDBRecord(course), { s3_folder: 's_3_folder' })

//  ----------------------------------------------------------------------------------------------//
type SqlRecord = Record<string, T.SerializableParameter>

export class CourseDAL<Sql extends T.Sql<Keyed>>{
  private readonly sql: Sql
  private readonly tbl: T.Helper<string>

  constructor(sql: Sql) {
    this.sql = sql
    this.tbl = sql('public.course')
  }

  getTableName() {
    return this.tbl
  }

  /**
   * Validate input data and create Course
   * @param {Course} Course course data
   * @returns {Promise<DBRecord>}
   * @throws if name duplicates
   */
  async create(c: Partial<Itself>): Promise<DBRecord> {
    const record: SqlRecord = courseToDBRecord(
      setDefaults(
        validateInput(c, ['name', 'squidexId', 'squidexSecret'])
      )
    )
    try {
      const [course] = await this.sql`
        insert into ${this.tbl} ${this.sql(record)}
        returning *
      `
      logger.dal('new Course successfully created:', hideSecret(course))
      return mapFromDBRecord(course)
    } catch (error) {
      if (error instanceof postgres.PostgresError && (<T.PostgresError>error).constraint_name === 'uq_course_name') {
        throw new APIError(400, 'Course with such name already exists.')
      }
      throw new APIError(<Error>error)
    }
  }

  /**
   * Retrieves list of Courses
   * @returns {Promise<DBRecord[]>}
   */
  async getList(): Promise<DBRecord[]> {
    const courses: DBRecord[] = await this.sql`
      select * from ${this.tbl}
    `
    logger.dal(`Courses list retrieved, ${courses?.length} items`)
    return courses.map(c => mapFromDBRecord(c))
  }

  /**
   * Retrieves Course by uuid
   * @param {string} uuid - course's id
   * @returns {Promise<DBRecord>}
   * @throws {APIError(404)} if not found
   */
  async getById(uuid: string): Promise<DBRecord> {
    const [course] = await this.sql`
      select * from ${this.tbl}
      where uuid = ${uuid}
    `
    if (!course) {
      throw new APIError(404, `Course with id "${uuid}" not found!`)
    }

    logger.dal('Course retrieved by id:', hideSecret(course))
    return mapFromDBRecord(course)
  }

  /**
   * Retrieves Course by name
   * @param {string} name - course's name
   * @returns {Promise<DBRecord>}
   * @throws {APIError(404)} if not found
   */
  async getByName(name: string): Promise<DBRecord> {
    const [course] = await this.sql`select * from ${this.tbl} where name = ${name}`
    if (!course) {
      throw new APIError(404, `Course with name "${name}" not found!`)
    }
    logger.dal('Course retrieved by name:', hideSecret(course))
    return mapFromDBRecord(course)
  }

  /**
   * Update/patch Course
   * @param {string} uuid - course id
   * @param {Partial<Itself>} u course data
   * @returns {Promise<DBRecord>}
   */
  async update(uuid: string, c: Partial<Itself>): Promise<DBRecord> {
    const record: SqlRecord = courseToDBRecord(
      removeUuid(c)
    )

    let courses
    try {
      courses = await this.sql`
        update ${this.tbl} set ${this.sql(record)}, "updated_at" = ${this.sql`now()`}
        where "uuid" = ${uuid}
        returning *
      `

      // const d = await this.sql`
      //   update ${this.tbl} set ${this.sql(record)}, "updated_at" = ${this.sql`now()`}
      //   where "uuid" = ${uuid}
      //   returning *
      // `.describe()
      // logger.dal('DESC:', d.string)

    } catch (error) {
      if (error instanceof postgres.PostgresError && (<T.PostgresError>error).constraint_name === 'uq_course_name') {
        throw new APIError(400, 'Course with such name already exists.')
      }
      throw new APIError(<Error>error)
    }

    if (!courses[0]) {
      throw new APIError(404, `Course with id "${uuid}" not found!`)
    }

    logger.dal('Course updated:', hideSecret(courses[0]))
    return mapFromDBRecord(courses[0])

  }

  /**
   * Update Course's publishing info: files, increment version and set publishedAt date
   *
   * @param {string} uuid - course id
   * @param {boolean} forced - "forced" publish, withoud version increment
   * @returns {Promise<DBRecord>}
   * @throws if not found
   */
  async updatePublished(name: string, forced = false): Promise<DBRecord> {
    const incVersion = forced ? this.sql`` : this.sql`"version" = "version" + 1,`
    const [course] = await this.sql`
      update ${this.tbl}
      set ${incVersion} "published_at" = ${this.sql`now()`}, squidex_auth_state = 'GREEN'
      where "name" = ${name}
      returning *
    `
    if (!course) {
      throw new APIError(404, `Course with name "${name}" not found!`)
    }

    logger.dal('Course updated after publishing:', hideSecret(course))
    return mapFromDBRecord(course)
  }


  /**
   * delete Course
   * @param {string} uuid - course id
   * @returns {Promise<void>
   */
  async delete(uuid: string): Promise<void> {
    await this.sql`
      delete from ${this.tbl} where "uuid" = ${uuid}
    `
    logger.dal(`Course ${uuid} deleted`)
  }

}
