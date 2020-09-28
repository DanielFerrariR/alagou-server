import mongoose from 'mongoose'

/**
 * Returns all alerts
 */
const fetchAllAlerts = async (): Promise<any> => {
  const Alert = mongoose.model('Alert')

  const alerts = (await Alert.find({
    _deleted: false
  })) as any

  let newAlerts = alerts.map((each: any) => {
    return {
      _id: each._id,
      title: each.title,
      content: each.content,
      severity: each.severity,
      date: each.date
    }
  })

  newAlerts = [...newAlerts].reverse()

  return newAlerts
}

export default fetchAllAlerts
