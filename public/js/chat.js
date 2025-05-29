document.addEventListener('DOMContentLoaded', () => {
  if (typeof io === 'undefined') {
    console.error('Socket.IO не загружен. Проверьте подключение <script src="/socket.io/socket.io.js"> или CDN.');
    return;
  }

  const chatIcon = document.getElementById('chatIcon');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const socket = io();

  chatIcon.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    if (chatWindow.style.display === 'flex') {
      chatInput.focus();
      socket.emit('chatMessage', 'start');
    }
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
      const message = chatInput.value.trim();
      appendMessage(message, 'user');
      socket.emit('chatMessage', message);
      chatInput.value = '';
    }
  });

  socket.on('botMessage', (msg) => {
    appendMessage(msg.text, msg.sender);
  });

  function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});