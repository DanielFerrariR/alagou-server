import express from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../midlewares'

const Track = mongoose.model('Track')

const router = express.Router()

router.use(requireAuth)

router.get('/tracks', async (req, res) => {
  const tracks = await Track.find({ userId: req.user._id })

  res.send(tracks)
})

router.post('/tracks', async (req, res) => {
  const { name, locations } = req.body

  if (!name || !locations) {
    return res
      .status(422)
      .send({ error: 'You must provide a name and locations' })
  }

  try {
    const track = new Track({ name, locations, userId: req.user._id })

    await track.save()

    return res.send(track)
  } catch (error) {
    return res.status(422).send({ error: error.message })
  }
})

export default router
