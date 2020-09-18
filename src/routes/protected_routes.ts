import express from 'express'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import { Flooding, User } from 'src/models'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'
import { ioInstance } from '../socket'
import { sendAllFloodings, generateToken } from '../utils'
import { emailConfirmationTemplate, supportTemplate } from '../email_templates'

const User = mongoose.model('User')
const Flooding = mongoose.model('Flooding')

const router = express.Router()

router.use(requireAuth)

router.post('/support', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(422).send({
        error: 'Você não pode enviar um e-mail em branco.'
      })
    }

    const user = (await User.findOne({
      _id: req.user._id,
      _deleted: { $nin: true }
    })) as User

    if (!user.isEmailConfirmed) {
      return res.status(422).send({
        error:
          'Você precisa confirmar seu e-mail para enviar um e-mail de suporte.'
      })
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
      to: process.env.NODEMAILER_EMAIL_ADRESS,
      subject: `Pedido de suporte do usuário: ${user.email}`,
      html: supportTemplate(user, message)
    }

    await transporter.sendMail(mailOptions)

    return res.send({ message: 'E-mail enviado com sucesso!' })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.get('/resent-email', async (req, res) => {
  try {
    const user = (await User.findOne({
      _id: req.user._id,
      _deleted: { $nin: true }
    })) as User

    if (user.isEmailConfirmed) {
      return res
        .status(422)
        .send({ error: 'O e-mail desta conta já está confirmado.' })
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
      to: user.email,
      subject: 'Link para confirmar o email',
      html: emailConfirmationTemplate(user.name, user.emailConfirmationToken)
    }

    await transporter.sendMail(mailOptions)

    return res.send({ message: 'E-mail enviado com sucesso!' })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.put('/edit-user', uploader.single('picture'), async (req, res) => {
  try {
    const { name, email, oldPassword, newPassword } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    if (!name || !email || (oldPassword && !newPassword)) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const user = (await User.findOne({
      _id: req.user._id,
      _deleted: { $nin: true }
    })) as User

    const futureUser = (await User.findOne({
      _id: { $nin: req.user._id },
      email,
      _deleted: { $nin: true }
    })) as User

    if (futureUser) {
      return res.status(422).send({ error: 'E-mail já cadastrado.' })
    }

    if (oldPassword) {
      if (!(await user.comparePassword(oldPassword))) {
        return res.status(422).send({ error: 'Senha atual inválida.' })
      }
    }

    let editedUserData: any = {
      name,
      email,
      picture
    }

    if (oldPassword) {
      editedUserData = { ...editedUserData, password: newPassword }
    }

    const emailConfirmationToken = generateToken()

    if (user.email !== email) {
      editedUserData = {
        ...editedUserData,
        isEmailConfirmed: false,
        emailConfirmationToken
      }
    }

    await user.updateOne(editedUserData)

    const updatedUser = (await User.findOne({
      _id: req.user._id,
      _deleted: { $nin: true }
    })) as User

    if (user.email !== email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.NODEMAILER_EMAIL_ADRESS,
          pass: process.env.NODEMAILER_PASSWORD
        }
      })

      const mailOptions = {
        from: `"Alagou" <${process.env.NODEMAILER_EMAIL_ADRESS}>`,
        to: updatedUser.email,
        subject: 'Link para confirmar o e-mail',
        html: emailConfirmationTemplate(
          updatedUser.name,
          updatedUser.emailConfirmationToken
        )
      }

      await transporter.sendMail(mailOptions)
    }

    const userData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      picture: updatedUser.picture,
      level: updatedUser.level,
      isAdmin: updatedUser.isAdmin,
      isEmailConfirmed: updatedUser.isEmailConfirmed
    }

    return res.send({ ...userData })
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/delete-account', async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res
        .status(422)
        .send({ error: 'É necessário informar a senha para excluir a conta.' })
    }

    const user = (await User.findOne({
      _id: req.user._id,
      _deleted: { $nin: true }
    })) as User

    if (!(await user.comparePassword(password))) {
      return res.status(422).send({ error: 'Senha inválida.' })
    }

    await user.updateOne({
      _deleted: true
    })

    ioInstance.emit('floodings', await sendAllFloodings())

    return res.send(true)
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/flooding', uploader.single('picture'), async (req, res) => {
  try {
    const { description, address, latitude, longitude, severity } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    const flooding = new Flooding({
      userId: req.user._id,
      description,
      address,
      latitude,
      longitude,
      picture,
      severity,
      date: new Date().getTime()
    })

    await flooding.save()

    res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

router.put('/flooding', uploader.single('picture'), async (req, res) => {
  try {
    const {
      _id,
      description,
      address,
      latitude,
      longitude,
      severity
    } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    if (
      !_id ||
      !description ||
      !address ||
      !latitude ||
      !longitude ||
      !severity
    ) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const flooding = (await Flooding.findOne({
      _id,
      userId: req.user._id,
      _deleted: { $nin: true }
    }).populate('userId')) as any

    await flooding.updateOne({
      description,
      address,
      latitude,
      longitude,
      picture,
      severity
    })

    return res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send({ error: error.message })
  }
})

router.delete('/flooding', async (req, res) => {
  try {
    const { _id } = req.body

    const flooding = (await Flooding.findOne({
      _id,
      _deleted: { $nin: true }
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    await flooding.updateOne({
      _deleted: true
    })

    return res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send({ error: error.message })
  }
})

router.post('/add-favorite', async (req, res) => {
  try {
    const { _id } = req.body

    const flooding = (await Flooding.findOne({
      _id,
      _deleted: { $nin: true }
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    const favorites = [...flooding.favorites]

    const convertedFavorites = favorites.map((each) => {
      return each.toString()
    })

    if (!convertedFavorites.includes(req.user._id.toString())) {
      favorites.push(req.user._id)

      await flooding.updateOne({
        favorites
      })
    }

    return res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/remove-favorite', async (req, res) => {
  try {
    const { _id } = req.body

    const flooding = (await Flooding.findOne({
      _id,
      _deleted: { $nin: true }
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    let favorites = [...flooding.favorites]

    favorites = favorites.filter((each) => {
      return each.toString() !== req.user._id.toString()
    })

    await flooding.updateOne({
      favorites
    })

    return res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/add-comment', async (req, res) => {
  try {
    const { _id, message } = req.body

    const flooding = (await Flooding.findOne({
      _id,
      _deleted: { $nin: true }
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    const newMessage = {
      userId: req.user._id,
      message,
      date: new Date().getTime()
    }

    const newMessages = [...flooding.messages]

    newMessages.push(newMessage)

    await flooding.updateOne({
      messages: newMessages
    })

    return res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

export default router