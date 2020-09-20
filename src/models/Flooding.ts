import mongoose from 'mongoose'
import { ioInstance } from '../socket'
import { sendAllFloodings } from '../utils'

export type Message = {
  userId: string
  message: string
  date: number
}

export type Flooding = {
  userId: string
  title: string
  address: string
  latitude: number
  longitude: number
  picture: string
  favorites: string[]
  _deleted: boolean
  date: number
  messages: Message[]
} & mongoose.Document

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
})

const floodingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
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
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    _deleted: {
      type: Boolean,
      default: false
    },
    messages: [messageSchema]
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

floodingSchema.post('updateOne', async function () {
  ioInstance.emit('floodings', await sendAllFloodings())
})

floodingSchema.post('save', async function () {
  ioInstance.emit('floodings', await sendAllFloodings())
})

mongoose.model('Flooding', floodingSchema)
