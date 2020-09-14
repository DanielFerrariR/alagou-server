import express from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'

const Flooding = mongoose.model('Flooding')

const router = express.Router()

router.get('/floodings', async (_req, res) => {
  const floodings = await Flooding.find().populate('userId')

  const newFloodings = floodings.map((each: any) => {
    return {
      _id: each._id,
      userId: each.userId._id,
      userName: each.userId.name,
      userPicture: each.userId.picture,
      description: each.description,
      address: each.address,
      latitude: each.latitude,
      longitude: each.longitude,
      picture: each.picture,
      severity: each.severity,
      date: each.date
    }
  })

  res.send(newFloodings)
})

router.use(requireAuth)

router.post('/flooding', uploader.single('picture'), async (req, res) => {
  const { description, address, latitude, longitude, severity, date } = req.body
  const picture = req.file.path

  try {
    const flooding = new Flooding({
      userId: req.user._id,
      description,
      address,
      latitude,
      longitude,
      picture,
      severity,
      date
    })

    await flooding.save()

    const floodings = (await Flooding.find().populate('userId')) as any

    const newFloodings = floodings.map((each: any) => {
      return {
        _id: each._id,
        userId: each.userId._id,
        userName: each.userId.name,
        userPicture: each.userId.picture,
        description: each.description,
        address: each.address,
        latitude: each.latitude,
        longitude: each.longitude,
        picture: each.picture,
        severity: each.severity,
        date: each.date
      }
    })

    res.send(newFloodings)
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

export default router
