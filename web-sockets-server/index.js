import { Server } from 'socket.io';

import messages from './../src/mocks/messages.json' assert { type: 'json' };

const formatMessage = (data, type = 'message') => {
  return {
    type,
    data
  };
};

const webSocketsServer = new Server({
  cors: { origin: 'http://localhost:5173' },
});

webSocketsServer.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.emit('message', formatMessage(messages, 'load-chat-messages'));

  socket.on('send-chat-message', (data) => {
    messages.push(data);
    console.log('New message received:', data);
    socket.broadcast.emit('message', formatMessage(data, 'chat-update'));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

webSocketsServer.listen(8000, () => {
  console.log('WebSocket server is running on port 8000');
});
