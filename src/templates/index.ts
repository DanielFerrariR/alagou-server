import fs from 'fs'
import path from 'path'
import { User } from 'src/models'

const emailConfirmationTemplate = (name: string, token: string): string => {
  let text = fs.readFileSync(
    path.resolve(__dirname, './email_confirmation.html'),
    'utf8'
  )

  text = text.replace('//name//', name)

  const port = process.env.EMAIL_PORT ? `:${process.env.EMAIL_PORT}` : ''

  text = text.replace(
    '//link//',
    `${process.env.SERVER_URL}${port}/confirm-email-link/${token}`
  )

  return text
}

const resetPasswordTemplate = (name: string, token: string): string => {
  let text = fs.readFileSync(
    path.resolve(__dirname, './reset_password.html'),
    'utf8'
  )

  text = text.replace('//name//', name)

  const port = process.env.EMAIL_PORT ? `:${process.env.EMAIL_PORT}` : ''

  text = text.replace(
    '//link//',
    `${process.env.SERVER_URL}${port}/reset-password-link/${token}`
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

const privacyPolicyTemplate = (): string => {
  const text = fs.readFileSync(
    path.resolve(__dirname, './privacy_policy.html'),
    'utf8'
  )

  return text
}

export {
  emailConfirmationTemplate,
  resetPasswordTemplate,
  supportTemplate,
  privacyPolicyTemplate
}
