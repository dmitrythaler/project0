import { getDAL } from '../index'
import type { User } from '../index'

const initUserDAL = async () => {
  try {
    const DAL = getDAL({
      host: 'localhost',
      port: 27017,
      database: process.env.DN_NAME || 'project-zero'
    })
    await DAL.init()
    const userDAL = DAL.getUserDAL()
    const collection = await userDAL.getColl()
    await collection.deleteMany({})

    const root: User.Self = {
      email: 'agentsmith@gmail.com',
      firstName: 'Agent',
      lastName: 'Smith',
      password: 'NeoMustDie',
      isActive: true,
      role: 'Admin'
    }
    const u = await userDAL.create(root)
    console.log('New Admin user successfully created:', u)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

initUserDAL()
