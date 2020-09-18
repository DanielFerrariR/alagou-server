/**
 * Generates a token to be used in email and password validation
 * @returns The token
 */
const generateToken = (): string => {
  const characters =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let token = ''

  for (let count = 0; count < 100; count += 1) {
    token += characters[Math.floor(Math.random() * characters.length)]
  }

  return token
}

export default generateToken
