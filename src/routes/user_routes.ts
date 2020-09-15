import express from 'express'
import mongoose from 'mongoose'
import { User } from 'src/models'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'
import { ioInstance } from '../socket'

const Flooding = mongoose.model('Flooding')
const User = mongoose.model('User')

const router = express.Router()

router.use(requireAuth)

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

    if (oldPassword) {
      if (!(await user.comparePassword(oldPassword))) {
        return res.status(422).send({ error: 'Senha atual inválida.' })
      }
    }

    await user.updateOne({
      name,
      email,
      password: oldPassword ? newPassword : req.user.password,
      picture
    })

    const userData = {
      _id: user._id,
      name,
      email,
      picture,
      level: user.level,
      isAdmin: user.isAdmin
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

    const floodings = (await Flooding.find().populate('userId')) as any

    const filteredFloodings = floodings.map(
      (each: any) => each.userId._deleted === false
    )

    const newFloodings = filteredFloodings.map((each: any) => {
      return {
        _id: each._id,
        userId: each.userId._id,
        userName: each.userId.name,
        userPicture: each.userId.profilePhoto,
        description: each.description,
        address: each.address,
        latitude: each.latitude,
        longitude: each.longitude,
        picture: each.picture,
        severity: each.severity,
        date: each.date,
        favorites: each.favorites
      }
    })

    ioInstance.emit('floodings', newFloodings)

    return res.send(true)
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

export default router
