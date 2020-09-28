import express from 'express'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import Papa from 'papaparse'
import { Flooding, User, Alert } from 'src/models'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'
import {
  fetchAllFloodings,
  generateToken,
  fetchAllAlerts,
  formatDate
} from '../utils'
import { emailConfirmationTemplate, supportTemplate } from '../templates'
import { ioInstance } from '../socket'

const User = mongoose.model('User')
const Flooding = mongoose.model('Flooding')
const Alert = mongoose.model('Alert')

const router = express.Router()

router.use(requireAuth)

router.get('/floodings-csv', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(422).send({
        error:
          'Você precisa ser um administrador para usar essa funcionalidade.'
      })
    }

    const floodings = await fetchAllFloodings()

    const newFloodings = floodings.map((each: any) => {
      return {
        _id: each._id,
        userName: each.userName,
        userPicture: each.userPicture,
        picture: each.picture,
        latitude: each.latitude,
        lontitude: each.longitude,
        address: each.address,
        date: formatDate(new Date(each.date)),
        title: each.title,
        severity: each.severity
      }
    })

    const data = Papa.unparse(newFloodings)

    return res.send(data)
  } catch (error) {
    console.log(error)
    return res.status(422).send({ error: error.message })
  }
})

router.post('/alert', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(422).send({
        error:
          'Você precisa ser um administrador para usar essa funcionalidade.'
      })
    }

    const { title, content, severity } = req.body

    if (!title || !content || !severity) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const alert = new Alert({
      title,
      content,
      severity,
      date: Date.now()
    })

    await alert.save()

    return res.send(await fetchAllAlerts())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.put('/alert', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(422).send({
        error:
          'Você precisa ser um administrador para usar essa funcionalidade.'
      })
    }

    const { _id, title, content, severity } = req.body

    if (!_id || !title || !content || !severity) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const alert = (await Alert.findOne({
      _id,
      _deleted: false
    })) as Alert

    if (!alert) {
      return res.status(422).send({ error: 'Alerta não encontrado.' })
    }

    await alert.updateOne({
      title,
      content,
      severity
    })

    return res.send(await fetchAllAlerts())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.delete('/alert', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(422).send({
        error:
          'Você precisa ser um administrador para usar essa funcionalidade.'
      })
    }

    const { _id } = req.body

    const alert = (await Alert.findOne({
      _id,
      _deleted: false
    })) as Alert

    if (!alert) {
      return res.status(422).send({ error: 'Alerta não encontrado.' })
    }

    await alert.updateOne({
      _deleted: true
    })

    return res.send(await fetchAllAlerts())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

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
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

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
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).send({
        error: 'E-mail inválido.'
      })
    }

    if (!oldPassword && newPassword) {
      return res.status(422).send({
        error: 'A senha atual deve ser informada se informar a nova senha.'
      })
    }

    const user = (await User.findOne({
      _id: req.user._id,
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

    const futureUser = (await User.findOne({
      _id: { $nin: req.user._id },
      email,
      _deleted: false
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
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

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
      isAdmin: updatedUser.isAdmin,
      isEmailConfirmed: updatedUser.isEmailConfirmed
    }

    ioInstance.emit('floodings', await fetchAllFloodings())

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
      _deleted: false
    })) as User

    if (!user) {
      return res.status(422).send({ error: 'Usuário não encontrado.' })
    }

    if (!(await user.comparePassword(password))) {
      return res.status(422).send({ error: 'Senha inválida.' })
    }

    await user.updateOne({
      _deleted: true
    })

    await Flooding.updateMany(
      { userId: req.user._id, _deleted: false },
      { _deleted: true }
    )

    return res.send(true)
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/flooding', uploader.single('picture'), async (req, res) => {
  try {
    const { title, address, latitude, longitude, severity } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    const flooding = new Flooding({
      userId: req.user._id,
      title,
      address,
      latitude,
      longitude,
      picture,
      severity,
      date: Date.now()
    })

    await flooding.save()

    res.send(await fetchAllFloodings())
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

router.put('/flooding', uploader.single('picture'), async (req, res) => {
  try {
    const { _id, title, address, latitude, longitude, severity } = req.body
    const picture = req.file ? req.file.path : req.body.picture

    if (!_id || !title || !address || !latitude || !longitude || !severity) {
      return res
        .status(422)
        .send({ error: 'Todos campos obrigatórios devem ser preenchidos.' })
    }

    const flooding = (await Flooding.findOne({
      _id,
      userId: req.user._id,
      _deleted: false
    }).populate('userId')) as any

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    await flooding.updateOne({
      title,
      address,
      latitude,
      longitude,
      picture,
      severity
    })

    return res.send(await fetchAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send({ error: error.message })
  }
})

router.delete('/flooding', async (req, res) => {
  try {
    const { _id } = req.body

    const flooding = (await Flooding.findOne({
      userId: req.user._id,
      _id,
      _deleted: false
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    await flooding.updateOne({
      _deleted: true
    })

    return res.send(await fetchAllFloodings())
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
      _deleted: false
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

    return res.send(await fetchAllFloodings())
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
      _deleted: false
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

    return res.send(await fetchAllFloodings())
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
      _deleted: false
    })) as Flooding

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    const newMessage = {
      userId: req.user._id,
      message,
      date: Date.now()
    }

    const newMessages = [...flooding.messages]

    newMessages.push(newMessage)

    await flooding.updateOne({
      messages: newMessages
    })

    return res.send(await fetchAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

router.post('/upload-floodings-csv', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(422).send({
        error:
          'Você precisa ser um administrador para usar essa funcionalidade.'
      })
    }

    const data = req.body

    if (!data) {
      return res.status(422).send({
        error: 'Você precisa enviar os alagamentos.'
      })
    }

    const newData = data.map((each: any) => {
      return { userId: req.user.id, ...each }
    })

    await Flooding.insertMany(newData)

    return res.send(await fetchAllFloodings())
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

export default router
