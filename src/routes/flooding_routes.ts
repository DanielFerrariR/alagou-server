import express from 'express'
import mongoose from 'mongoose'
import { Flooding } from 'src/models'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'

const Flooding = mongoose.model('Flooding')

const router = express.Router()

router.get('/floodings', async (_req, res) => {
  try {
    const floodings = await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const newFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
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
    const picture = req.file ? req.file.path : req.body.picture

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

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const newFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
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

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const updatedFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
      }
    })

    return res.send(updatedFloodings)
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

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const updatedFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
      }
    })

    return res.send(updatedFloodings)
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

    favorites.push(_id)

    await flooding.updateOne({
      favorites
    })

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const updatedFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
      }
    })

    return res.send(updatedFloodings)
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
      return each.toString() !== _id
    })

    await flooding.updateOne({
      favorites
    })

    const floodings = (await Flooding.find({
      _deleted: { $nin: true }
    }).populate('userId')) as any

    const filteredFloodings = floodings.filter(
      (each: any) => each.userId._deleted === false
    )

    const updatedFloodings = filteredFloodings.map((each: any) => {
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
        date: each.date,
        favorites: each.favorites
      }
    })

    return res.send(updatedFloodings)
  } catch (error) {
    console.log(error)

    return res.status(422).send(error.message)
  }
})

export default router
