import mongoose from 'mongoose'
import { ioInstance } from '../socket'

export type Flooding = {
  userId: string
  description: string
  address: string
  latitude: number
  longitude: number
  picture: string
} & mongoose.Document

const floodingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
      type: Number,
      required: true
    },
    picture: {
      type: String
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
    },
    _deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

floodingSchema.post('updateOne', async function () {
  const Flooding = mongoose.model('Flooding')

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
      date: each.date
    }
  })

  ioInstance.emit('floodings', newFloodings)
})

floodingSchema.post('save', async function () {
  const Flooding = mongoose.model('Flooding')

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
      date: each.date
    }
  })

  ioInstance.emit('floodings', newFloodings)
})

mongoose.model('Flooding', floodingSchema)
