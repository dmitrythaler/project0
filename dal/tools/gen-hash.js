import bcrypt from 'bcrypt'
import { argv } from 'process'

const password = argv[2] || '********'
const hash = bcrypt.hashSync(password, 12)
console.log(hash) //  <-- for ex. $2b$12$AlDaZ48.zr0gFDagbMb77eF17P3v3yQ..CrAf6CTusqKamSE6vPGS

// console.log(bcrypt.compareSync(password, hash))
