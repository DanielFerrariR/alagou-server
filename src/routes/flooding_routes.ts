import express from 'express'
import mongoose from 'mongoose'
import { Flooding } from 'src/models'
import { requireAuth } from '../midlewares'
import uploader from '../cloudinary'
import { sendAllFloodings } from '../utils'

const Flooding = mongoose.model('Flooding')

const router = express.Router()

router.get('/floodings', async (_req, res) => {
  try {
    res.send(await sendAllFloodings())
  } catch (error) {
    console.log(error)
    res.status(422).send({ error: error.message })
  }
})

router.use(requireAuth)

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
