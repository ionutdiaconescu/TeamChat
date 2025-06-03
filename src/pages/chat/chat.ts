import { Socket } from "socket.io-client";
import { createFriendItem, createMessageBubble } from './chatTemplates';
import { loadHeader } from './../../services/page.service';
import { connectToWebSocketsServer } from '../../services/web-sockets-service/web-sockets.service';
import { ChatMessage, WssMessage } from './chat.types';

 import friends from './../../mocks/friends.json' assert { type: 'json' };

const messagesContainer = document.querySelector('.chat-messages')!;
const messageInput = document.getElementById(
  'messageInput'
)! as HTMLInputElement;
const sendBtn = document.getElementById('sendMessageBtn')!;

let wsSocket: Socket | null = null;
let messages: ChatMessage[] = [];

const loggedInUser = 'Jane Smith';

initializePage();

function initializePage() {
  loadHeader();
  renderFriendsList();
  connectToWsServer();
  sendBtn.addEventListener('click', onSendMessage);
}

function connectToWsServer() {
  wsSocket = connectToWebSocketsServer({
    onMessage: onRecieveMessageFromWsServer,
    onError: onWssError
  });
}

function onRecieveMessageFromWsServer(message: WssMessage) {
  switch (message.type) {
    case 'load-chat-messages':
      messages = message.data || [];
      renderMessages();
      break;
    case 'chat-update':
      const newMessage = message.data;

      const messageBubble = createMessageBubble(
        newMessage.message,
        newMessage.time,
        'left',
        newMessage.from
      );
      messagesContainer.append(messageBubble);
      break;
  }
}

function onWssError(error: Error) {
  console.error('WebSocket error:', error);
}

function renderFriendsList() {
  const friendList = document.querySelector('.friend-list');

  if (friendList) {
    friends.forEach((friend) => {
      const userItem = createFriendItem(
        friend.name,
        friend.status,
        friend.isOnline
      );
      friendList.append(userItem);
    });
  }
}

function renderMessages() {
  if (messagesContainer) {
    messages.forEach((msg) => {
      const messageBubble = createMessageBubble(
        msg.message,
        msg.time,
        msg.from === loggedInUser ? 'right' : 'left',
        msg.from
      );

      messagesContainer.append(messageBubble);
    });
  }
}

// Send message

function onSendMessage() {
  const message = messageInput.value;
  if (message.trim() === '') return;

  const newMessage = {
    from: loggedInUser,
    time: new Date().toISOString(),
    message,
  };

  messages.push(newMessage);

  const messageBubble = createMessageBubble(
    newMessage.message,
    newMessage.time,
    'right',
    loggedInUser
  );

  if (wsSocket) {
    wsSocket.emit('send-chat-message', newMessage);
  } else {
    throw new Error('WebSocket connection is not established');
  }

  messagesContainer.append(messageBubble);
  messageInput.value = '';
}
