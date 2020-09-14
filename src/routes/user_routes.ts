import express from 'express'
import mongoose from 'mongoose'
import { User } from 'src/models'
import { requireAuth } from '../midlewares'

const User = mongoose.model('User')

const router = express.Router()

router.use(requireAuth)

router.post('/add_favorite', async (req, res) => {
  const { _id: floodingId } = req.body

  const user = (await User.findOne({ _id: req.user._id })) as User

  if (!user) {
    return res.status(401).send({ error: 'Usuário não existe.' })
  }

  const favorites = [...user.favorites]

  favorites.push(floodingId)

  await user.updateOne({
    favorites
  })

  const updatedUser = (await User.findOne({ _id: req.user._id })) as User

  const userData = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    picture: updatedUser.picture,
    level: updatedUser.level,
    favorites: updatedUser.favorites
  }

  return res.send({ ...userData })
})

router.post('/remove_favorite', async (req, res) => {
  const { _id: floodingId } = req.body

  const user = (await User.findOne({ _id: req.user._id })) as User

  if (!user) {
    return res.status(401).send({ error: 'Usuário não existe.' })
  }

  let favorites = [...user.favorites]

  favorites = favorites.filter((each) => {
    return each.toString() !== floodingId
  })

  await user.updateOne({
    favorites
  })

  const updatedUser = (await User.findOne({ _id: req.user._id })) as User

  const userData = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    picture: updatedUser.picture,
    level: updatedUser.level,
    favorites: updatedUser.favorites
  }

  return res.send({ ...userData })
})

export default router
