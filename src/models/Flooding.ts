import mongoose from 'mongoose'
import { sendFloodings } from '../socket'

export type Flooding = {
  userId: number
  description: string
  address: string
  latitude: number
  longitude: number
  picture: string
} & mongoose.Document

const floodingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number
  },
  picture: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
})

floodingSchema.post('save', async (document) => {
  const Floodings = document.constructor as mongoose.Model<
    mongoose.Document,
    Record<string, unknown>
  >
  const floodings = (await Floodings.find().populate('userId')) as any

  const newFloodings = floodings.map((each: any) => {
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
      date: each.date
    }
  })

  sendFloodings(newFloodings)
})

mongoose.model('Flooding', floodingSchema)
