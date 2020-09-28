import mongoose from 'mongoose'
import { ioInstance } from '../socket'
import { fetchAllFloodings } from '../utils'

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
  isVerified: boolean
  severity: number
  omitHours: boolean
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
      min: 0,
      max: 3,
      required: true
    },
    omitHours: {
      type: Boolean,
      default: false
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
    messages: [messageSchema],
    isVerified: {
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

floodingSchema.post('updatedMany', async function () {
  ioInstance.emit('floodings', await fetchAllFloodings())
})

floodingSchema.post('insertMany', async function () {
  ioInstance.emit('floodings', await fetchAllFloodings())
})

floodingSchema.post('updateOne', async function () {
  ioInstance.emit('floodings', await fetchAllFloodings())
})

floodingSchema.post('save', async function () {
  ioInstance.emit('floodings', await fetchAllFloodings())
})

mongoose.model('Flooding', floodingSchema)
