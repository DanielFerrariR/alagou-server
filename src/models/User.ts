import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

export type User = {
  name: string
  email: string
  password: string
  picture: string
  level: number
  favorites: string[]
  comparePassword: (candidate: string) => Promise<boolean>
} & mongoose.Document

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    picture: {
      type: String
    },
    level: {
      type: Number,
      default: 0
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flooding' }]
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

userSchema.pre('save', async function (next) {
  const user = this as User

  if (!user.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(user.password, salt)

    user.password = hash

    return next()
  } catch (error) {
    return next(error)
  }
})

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const user = this

  return bcrypt.compare(candidatePassword, user.password)
}

mongoose.model('User', userSchema)
