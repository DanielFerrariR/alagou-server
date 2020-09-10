import mongoose from 'mongoose'

export type Flooding = {
  userId: number[]
  description: string
  address: string
  photo: string
  location: {
    timestamp: number
    coords: {
      latitude: number
      longitude: number
      altitude: number
      accuracy: number
      heading: number
      speed: number
    }
  }
} & mongoose.Document

const pointSchema = new mongoose.Schema({
  coords: {
    latitude: Number,
    longitude: Number,
    altitude: Number,
    accuracy: Number,
    heading: Number,
    speed: Number
  }
})

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
  },
  location: pointSchema
})

mongoose.model('Flooding', floodingSchema)
