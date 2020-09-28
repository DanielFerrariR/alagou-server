import mongoose from 'mongoose'

/**
 * Returns all floodings
 */
const fetchAllFloodings = async (): Promise<any> => {
  const Flooding = mongoose.model('Flooding')

  const floodings = (await Flooding.find({
    _deleted: false
  })
    .populate('userId')
    .populate({ path: 'messages', populate: { path: 'userId' } })) as any

  let newFloodings = floodings.map((each: any) => {
    let newMessages = each.messages.map((insideEach: any) => {
      return {
        _id: insideEach._id,
        message: insideEach.message,
        userId: insideEach.userId._id,
        userName: insideEach.userId.name,
        userPicture: insideEach.userId.picture,
        date: insideEach.date,
        loading: insideEach.loading
      }
    })

    newMessages = [...newMessages].reverse()

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

  newFloodings = newFloodings.sort((first: any, second: any) => {
    if (first.date > second.date) {
      return -1
    }
    if (first.date === second.date) {
      return 0
    }
    return 1
  })

  return newFloodings
}

export default fetchAllFloodings
