import mongoose from 'mongoose'

/**
 * Returns all alerts
 */
const sendAllAlerts = async (): Promise<any> => {
  const Alert = mongoose.model('Alert')

  const alerts = await Alert.find({
    _deleted: false
  })

  return alerts
}

export default sendAllAlerts
