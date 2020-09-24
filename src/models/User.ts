import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

export type User = {
  name: string
  email: string
  password: string
  picture: string
  _deleted: boolean
  isAdmin: boolean
  isEmailConfirmed: boolean
  emailConfirmationToken: string
  resetPasswordConfirmationToken: string
  resetPasswordTokenExpires: Date
  activeToken: string
  comparePassword: (candidate: string) => Promise<boolean>
  _update: User
} & mongoose.Document

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    picture: {
      type: String
    },
    _deleted: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isEmailConfirmed: {
      type: Boolean,
      default: false
    },
    emailConfirmationToken: {
      type: String,
      required: true
    },
    resetPasswordConfirmationToken: {
      type: String
    },
    resetPasswordTokenExpires: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

userSchema.pre('updateOne', async function (next) {
  const user = (this as unknown) as User

  if (!user._update.password) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(user._update.password, salt)

    user._update.password = hash

    return next()
  } catch (error) {
    return next(error)
  }
})

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
