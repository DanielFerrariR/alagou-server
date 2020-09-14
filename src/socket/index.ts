let ioInstance: any

const startIo = (server: any): void => {
  ioInstance = require('socket.io').listen(server)
}

export { ioInstance, startIo }
