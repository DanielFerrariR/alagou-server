import mongoose from 'mongoose'

/**
 * Returns all floodings
 */
const sendAllFloodings = async (): Promise<any> => {
  const Flooding = mongoose.model('Flooding')

  const floodings = (await Flooding.find({
    _deleted: false
  })
    .populate('userId')
    .populate({ path: 'messages', populate: { path: 'userId' } })) as any

  const newFloodings = floodings.map((each: any) => {
    const newMessages = each.messages.map((insideEach: any) => {
      return {
        _id: insideEach._id,
        message: insideEach.message,
        userId: insideEach.userId._id,
        userName: insideEach.userId.name,
        userPicture: insideEach.userId.picture,
        date: insideEach.date
      }
    })

    return {
      _id: each._id,
      userId: each.userId._id,
      userName: each.userId.name,
      userPicture: each.userId.picture,
      title: each.title,
      address: each.address,
      latitude: each.latitude,
      longitude: each.longitude,
      picture: each.picture,
      severity: each.severity,
      date: each.date,
      favorites: each.favorites,
      messages: newMessages,
      isVerified: each.isVerified,
      omitHours: each.omitHours
    }
  })

  return newFloodings
}

export default sendAllFloodings
