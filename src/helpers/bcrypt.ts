import { compareSync, genSaltSync, hashSync } from 'bcrypt'

export const hashPassword = (password: string) => hashSync(password, genSaltSync(10))

export const comparePassword = (password: string, hashedPassword: string) => compareSync(password, hashedPassword)