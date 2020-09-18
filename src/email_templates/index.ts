import fs from 'fs'
import path from 'path'
import { User } from 'src/models'

const emailConfirmationTemplate = (name: string, token: string): string => {
  let text = fs.readFileSync(
    path.resolve(__dirname, './email_confirmation.html'),
    'utf8'
  )

  text = text.replace('//name//', name)

  text = text.replace(
    '//link//',
    `${process.env.SERVER_URL}:${process.env.SERVER_PORT}/confirm-email-link/${token}`
  )

  return text
}

const resetPasswordTemplate = (name: string, token: string): string => {
  let text = fs.readFileSync(
    path.resolve(__dirname, './reset_password.html'),
    'utf8'
  )

  text = text.replace('//name//', name)

  text = text.replace(
    '//link//',
    `${process.env.SERVER_URL}:${process.env.SERVER_PORT}/reset-password-link/${token}`
  )

  return text
}

const supportTemplate = (user: User, message: string): string => {
  let text = fs.readFileSync(path.resolve(__dirname, './support.html'), 'utf8')

  text = text.replace('//id//', user._id)
  text = text.replace('//name//', user.name)
  text = text.replace('//email//', user.email)
  text = text.replace('//message//', message)

  return text
}

export { emailConfirmationTemplate, resetPasswordTemplate, supportTemplate }
