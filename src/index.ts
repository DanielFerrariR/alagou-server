import dotenv from 'dotenv'
import './models'
import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { startIo } from './socket'
import { unprotectedRoutes, protectedRoutes } from './routes'
import { requireAuth } from './midlewares'
import { ensure } from './utils'

dotenv.config()

const app = express()

app.use(bodyParser.json())
app.use(unprotectedRoutes)
app.use(protectedRoutes)

const mongoUri = ensure(process.env.MONGO_URI)

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('Connected to mongo instance')
})

mongoose.connection.on('error', (error) => {
  console.error('Error conecting to mongo', error)
})

app.get('/', requireAuth, (req: Request, res: Response) => {
  res.send(`Your email: ${req.user.email}`)
})

const server = require('http').createServer(app)

server.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`)
})

startIo(server)
