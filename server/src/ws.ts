import type { Server } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'

const HEARTBEAT_INTERVAL_MS = 30_000

type AliveSocket = WebSocket & { isAlive?: boolean }

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (socket: AliveSocket, req) => {
    socket.isAlive = true
    console.log(`WS connected: ${req.socket.remoteAddress}`)

    socket.on('pong', () => {
      socket.isAlive = true
    })

    socket.on('message', (data, isBinary) => {
      if (isBinary) return

      let message: unknown
      try {
        message = JSON.parse(data.toString())
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        return
      }

      // TODO: route messages by type
      socket.send(JSON.stringify({ type: 'echo', data: message }))
    })

    socket.on('close', () => {
      console.log('WS disconnected')
    })

    socket.on('error', (err) => {
      console.error('WS error:', err)
    })
  })

  // Terminate connections that stop answering pings (e.g. dropped networks)
  const heartbeat = setInterval(() => {
    for (const client of wss.clients as Set<AliveSocket>) {
      if (!client.isAlive) {
        client.terminate()
        continue
      }
      client.isAlive = false
      client.ping()
    }
  }, HEARTBEAT_INTERVAL_MS)

  wss.on('close', () => clearInterval(heartbeat))

  return wss
}

export function broadcast(wss: WebSocketServer, payload: unknown) {
  const msg = JSON.stringify(payload)
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg)
  }
}
