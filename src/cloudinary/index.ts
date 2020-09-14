import dotenv from 'dotenv'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

const cloudinary = require('cloudinary').v2

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDKEY,
  api_secret: process.env.CLOUDSECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pictures',
    format: 'png'
  }
})

export default multer({ storage })
