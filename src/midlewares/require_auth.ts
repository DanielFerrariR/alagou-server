import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Request, Response, NextFunction } from 'express'
import { User } from 'src/models/User'
import { ensure } from '../utils'

type Payload = {
  userId: string
}

const User = mongoose.model('User')

const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).send({ error: 'Não autorizado.' })
  }

  const token = authorization.replace('Bearer ', '')

  jwt.verify(token, ensure(process.env.SECRET_KEY), async (error, payload) => {
    if (error) {
      return res.status(401).send({ error: 'Não autorizado.' })
    }

    const { userId } = payload as Payload

    const user = (await User.findById(userId)) as User

    if (!user) {
      return res.status(401).send({ error: 'Não autorizado.' })
    }

    req.user = user as User

    return next()
  })
}

export default requireAuth
