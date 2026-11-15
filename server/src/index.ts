import { createServer } from 'node:http'
import express from 'express'
import { setupWebSocket } from './ws.js'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({message: "Bahut maja aa raha hain"})
})

const server = createServer(app)
setupWebSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
})
