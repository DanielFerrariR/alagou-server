import mongoose from 'mongoose'

/**
 * Returns all alerts
 */
const sendAllAlerts = async (): Promise<any> => {
  const Alert = mongoose.model('Alert')

  const alerts = (await Alert.find({
    _deleted: false
  })) as any

  const newAlerts = alerts.map((each: any) => {
    return {
      _id: each._id,
      title: each.title,
      content: each.content,
      severity: each.severity,
      date: each.date
    }
  })

  return newAlerts
}

export default sendAllAlerts
