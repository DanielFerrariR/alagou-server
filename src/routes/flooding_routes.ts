import express from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'
import { ioInstance } from '../socket'

const Flooding = mongoose.model('Flooding')

const router = express.Router()

router.get('/floodings', async (_req, res) => {
  try {
    const floodings = await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')

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

router.use(requireAuth)

router.post('/flooding', uploader.single('picture'), async (req, res) => {
  try {
    const {
      description,
      address,
      latitude,
      longitude,
      severity,
      date
    } = req.body
    const picture = req.file.path

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

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

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

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const updatedFloodings = floodings.map((each: any) => {
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

    res.send(updatedFloodings)
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

router.delete('/flooding', async (req, res) => {
  try {
    const { _id } = req.body

    const flooding = await Flooding.findOne({ _id, _deleted: { $nin: true } })

    if (!flooding) {
      return res.status(422).send({ error: 'Alagamento não encontrado.' })
    }

    await flooding.updateOne({
      _deleted: true
    })

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const updatedFloodings = floodings.map((each: any) => {
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

    ioInstance.emit('deletedFlooding', _id)

    return res.send(updatedFloodings)
  } catch (error) {
    console.log(error)

    return res.status(422).send({ error: error.message })
  }
})

export default router
