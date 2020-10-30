import express from 'express'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'
import { User } from 'src/models'
import uploader from '../cloudinary'
import {
  ensure,
  generateToken,
  fetchAllFloodings,
  fetchAllAlerts
} from '../utils'
import {
  emailConfirmationTemplate,
  resetPasswordTemplate,
  privacyPolicyTemplate
} from '../templates'

const User = mongoose.model('User')

const router = express.Router()

router.get('/privacy-policy', (_req, res) => {
  res.send(privacyPolicyTemplate())
})

router.post('/register', uploader.single('picture'), async (req, res) => {
  try {
    const { name, email, password } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    if (!name || !email || !password) {
      return res
        .status(422)
        .send({ error: 'Todos os campos obrigatórios devem ser preenchidos' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).send({
        error: 'E-mail inválido.'
      })
    }

    const futureUser = (await User.findOne({
      email,
      _deleted: false
    })) as User

    if (futureUser) {
      return res.status(422).send({ error: 'E-mail já cadastrado.' })
    }

    const emailConfirmationToken = generateToken()

    const user = new User({
      name,
      email,
      password,
      picture,
      emailConfirmationToken
    })

    await user.save()

    const token = jwt.sign({ userId: user._id }, ensure(process.env.SECRET_KEY))

    const newUser = (await User.findOne({
      email,
      _deleted: false
    })) as User

    if (!newUser) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

    const userData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      picture: newUser.picture,
      isAdmin: newUser.isAdmin,
      isEmailConfirmed: newUser.isEmailConfirmed
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL_ADRESS,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })

    const mailOptions = {
      from: `"Alagou" <${process.env.NODEMAILER_EMAIL_ADRESS}>`,
      to: newUser.email,
      subject: 'Link para confirmar o e-mail',
      html: emailConfirmationTemplate(newUser.name, emailConfirmationToken)
    }

    await transporter.sendMail(mailOptions)

    return res.send({ ...userData, token })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const user = (await User.findOne({
      email,
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Senha ou e-mail inválido.' })
    }

    const isEqual = await user.comparePassword(password)

    if (!isEqual) {
      return res.status(422).send({ error: 'Senha ou e-mail inválido.' })
    }

    const token = jwt.sign({ userId: user._id }, ensure(process.env.SECRET_KEY))

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      isAdmin: user.isAdmin,
      isEmailConfirmed: user.isEmailConfirmed
    }

    return res.send({ ...userData, token })
  } catch (error) {
    console.log(error)
    return res.status(422).send({ error: 'Senha ou e-mail inválido.' })
  }
})

router.post('/confirm-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const user = (await User.findOne({ emailConfirmationToken: token })) as User

    if (!user) {
      return res.status(422).send({
        error: 'Usuário não encontrado ou link expirado ou já utilizado.'
      })
    }

    await user.updateOne({
      emailConfirmationToken: null,
      isEmailConfirmed: true
    })

    return res.send({ message: 'O e-mail foi confirmado com sucesso!' })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/confirm-reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const user = (await User.findOne({
      resetPasswordConfirmationToken: token,
      resetPasswordTokenExpires: {
        $gt: Date.now()
      }
    })) as User

    if (!user) {
      return res.status(422).send({
        error: 'Usuário não encontrado ou link expirado ou já utilizado.'
      })
    }

    await user.updateOne({
      password: newPassword,
      resetPasswordConfirmationToken: null,
      resetPasswordTokenExpires: null
    })

    return res.send({ message: 'Senha atualizada com sucesso!' })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const user = (await User.findOne({ email })) as User

    if (!user) {
      return res.status(422).send({
        error: 'Usuário não encontrado.'
      })
    }

    const token = generateToken()

    await user.updateOne({
      resetPasswordConfirmationToken: token,
      resetPasswordTokenExpires: Date.now() + 3600000
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL_ADRESS,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })

    const mailOptions = {
      from: `"Alagou" <${process.env.NODEMAILER_EMAIL_ADRESS}>`,
      to: user.email,
      subject: 'Link para resetar a senha',
      html: resetPasswordTemplate(user.name, token)
    }

    await transporter.sendMail(mailOptions)

    return res.send({ message: 'E-mail enviado com sucesso!' })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.get('/confirm-email-link/:token', (req, res) => {
  const { token } = req.params

  res.redirect(`alagou://EmailConfirmation/${token}`)
})

router.get('/reset-password-link/:token', (req, res) => {
  const { token } = req.params

  res.redirect(`alagou://ResetPassword/${token}`)
})

router.get('/floodings', async (_req, res) => {
  try {
    res.send(await fetchAllFloodings())
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

router.get('/alerts', async (_req, res) => {
  try {
    res.send(await fetchAllAlerts())
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

export default router
