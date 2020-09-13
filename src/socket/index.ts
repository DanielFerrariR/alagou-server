let ioInstance: any

const startIo = (server: any): void => {
  ioInstance = require('socket.io').listen(server)
}

const sendFloodings = (floodings: any): void => {
  ioInstance.emit('floodings', floodings)
}

export { startIo, sendFloodings }
