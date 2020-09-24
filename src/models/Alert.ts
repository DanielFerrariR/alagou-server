import mongoose from 'mongoose'
import { ioInstance } from '../socket'
import { sendAllAlerts } from '../utils'

export type Alert = {
  title: string
  content: string
  severity: number
  date: number
  _deleted: true
} & mongoose.Document

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
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

alertSchema.post('updateOne', async function () {
  ioInstance.emit('alerts', await sendAllAlerts())
})

alertSchema.post('save', async function () {
  ioInstance.emit('alerts', await sendAllAlerts())
})

mongoose.model('Alert', alertSchema)
