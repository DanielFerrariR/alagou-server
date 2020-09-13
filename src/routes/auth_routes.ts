import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { User } from 'src/models'
import uploader from '../cloudinary'
import { ensure } from '../utils'

const User = mongoose.model('User')

const router = express.Router()

router.post('/register', uploader.single('profilePhoto'), async (req, res) => {
  const profilePhoto = req.file ? req.file.path : ''
  const { name, email, password } = req.body

  try {
    const user = new User({
      name,
      email,
      password,
      profilePhoto
    })

    await user.save()

    const token = jwt.sign({ userId: user._id }, ensure(process.env.SECRET_KEY))

    const { password: newPassword, ...newUser } = (await User.findOne({
      email
    })) as User

    res.status(200).send({ ...newUser, token })
  } catch (error) {
    console.log(error)
    res.status(422).send(error.message)
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(422).send({ error: 'Deve informar o usuário e a senha.' })
  }

  const { password: newPassword, ...user } = (await User.findOne({
    email
  })) as User

  if (!user) {
    return res.status(401).send({ error: 'Senha ou e-mail inválido.' })
  }

  try {
    const isEqual = await user.comparePassword(password)

    if (!isEqual) {
      return res.status(401).send({ error: 'Senha ou e-mail inválido.' })
    }

    const token = jwt.sign({ userId: user._id }, ensure(process.env.SECRET_KEY))

    return res.send({ ...user, token })
  } catch (error) {
    console.log(error)
    return res.status(401).send({ error: 'Senha ou e-mail inválido.' })
  }
})

export default router
