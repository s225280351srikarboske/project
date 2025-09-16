document.addEventListener('DOMContentLoaded', function() {
    // Load messages
    loadMessages();
    
    // Event listeners
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});

async function loadMessages() {
    try {
        const messages = await api('/api/messages');
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderMessages(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">No messages yet</div>';
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.direction}">
            <p>${msg.content}</p>
            <span class="message-time">${formatTime(msg.timestamp)}</span>
        </div>
    `).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        // Add message to UI immediately
        const messagesContainer = document.getElementById('chatMessages');
        const now = new Date();
        
        messagesContainer.innerHTML += `
            <div class="message sent">
                <p>${message}</p>
                <span class="message-time">${formatTime(now)}</span>
            </div>
        `;
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Send to server
        await api('/api/messages', 'POST', { content: message });
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
    }
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}