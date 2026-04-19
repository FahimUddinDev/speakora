import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`[Socket] ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('voice_chunk', (data: { conversationId: string; chunk: Buffer }) => {
      // In the future this could be routed to a fully streaming STT engine.
      // Right now Phase 2 will use HTTP POST for entire audio blocks instead to start.
      console.log(`[Socket] Received voice chunk for ${data.conversationId}`);
    });

    socket.on('interrupt_ai', (conversationId: string) => {
      // Broadcast interrupt signal to all clients in the conversation to stop TTS playback
      io.to(conversationId).emit('interrupted');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
