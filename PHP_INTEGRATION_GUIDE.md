# PHP Backend Integration Guide

## 🎯 Aapka System Ab PHP Ke Saath Kaise Kaam Karega

### **Step 1: PHP Backend Setup**

Aapke PHP backend me ye endpoints hone chahiye:

```php
// PHP API Endpoints
GET  /api/chat-session/{uniqueId}     // Chat session fetch karna
GET  /api/user/{userId}              // User details fetch karna  
GET  /api/astrologer/{astrologerId}  // Astrologer details fetch karna
POST /api/create-chat               // New chat session create karna
GET  /api/user-chats/{userId}       // User ke saare chats fetch karna
```

### **Step 2: Next.js Me Integration**

```typescript
// src/lib/php-integration.ts me ye functions hain:

const phpIntegration = new PHPIntegration('https://your-php-backend.com');

// PHP se unique ID aur user details fetch karna
const session = await phpIntegration.getChatSession('unique_id_from_php');
const user = await phpIntegration.getUserDetails('user_123');
const astrologer = await phpIntegration.getAstrologerDetails('astrologer_456');
```

### **Step 3: Flow Kaise Kaam Karega**

1. **User aapke PHP system se login karta hai**
2. **PHP system unique ID generate karta hai**
3. **Next.js me user unique ID ke saath chat join karta hai**
4. **Firebase me chat store hota hai**
5. **Real-time messages sync hote hain**

### **Step 4: Code Example**

```typescript
// Chat list me PHP se data fetch karna
const loadChatSessions = async () => {
  try {
    // PHP se user ke chats fetch karna
    const phpSessions = await phpIntegration.getUserChatSessions('user_123');
    
    // Har session ke liye Firebase me chat create karna
    const firebaseSessions = await Promise.all(
      phpSessions.map(async (phpSession) => {
        return await getOrCreateChatSession(
          phpSession.uniqueId,
          phpSession.userId,
          phpSession.astrologerId
        );
      })
    );
    
    setChats(firebaseSessions);
  } catch (error) {
    console.error('Error loading chats:', error);
  }
};
```

### **Step 5: Real Implementation**

```typescript
// src/app/chatlist/page.tsx me ye changes karni hongi:

const handleNewChat = async () => {
  try {
    // PHP se new chat session create karna
    const phpSession = await phpIntegration.createChatSession('user_123', 'astrologer_456');
    
    // Firebase me session create karna
    const firebaseSession = await getOrCreateChatSession(
      phpSession.uniqueId,
      phpSession.userId,
      phpSession.astrologerId
    );
    
    // Chat me navigate karna
    router.push(`/chatbox?id=${firebaseSession.id}&uniqueId=${phpSession.uniqueId}`);
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};
```

### **Step 6: PHP Backend Response Format**

```json
// PHP API Response Format
{
  "uniqueId": "chat_12345_abc",
  "userId": "user_123",
  "astrologerId": "astrologer_456",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### **Step 7: Firebase Me Data Structure**

```javascript
// Firestore Collections
chatSessions: {
  [sessionId]: {
    uniqueId: "chat_12345_abc",  // PHP se aaya unique ID
    userId: "user_123",
    astrologerId: "astrologer_456",
    status: "active",
    createdAt: timestamp,
    lastMessage: "Hello!",
    lastMessageTime: timestamp
  }
}

messages: {
  [messageId]: {
    chatId: "firebase_session_id",
    senderId: "user_123",
    senderType: "user",
    message: "Hello!",
    messageType: "text",
    timestamp: timestamp,
    fileUrl: "optional_file_url"
  }
}
```

### **Step 8: Complete Flow**

1. **User PHP system me login karta hai**
2. **PHP system unique ID generate karta hai**
3. **Next.js me user unique ID ke saath chat join karta hai**
4. **Firebase me chat session create hota hai**
5. **Messages real-time me sync hote hain**
6. **Files Firebase Storage me store hote hain**

### **Step 9: Testing**

1. `/demo` page pe jaaiye
2. "Create New Chat" button click kariye
3. Unique ID generate hoga
4. "Join Chat Session" me unique ID enter kariye
5. Chat open hoga

### **Step 10: Production Setup**

```typescript
// src/lib/php-integration.ts me aapka PHP backend URL set kariye
const phpIntegration = new PHPIntegration('https://your-php-backend.com');

// Authentication headers add kariye
const response = await fetch(`${this.baseUrl}/api/chat-session/${uniqueId}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 🚀 **Ready to Use!**

Aapka system ab PHP backend ke saath perfectly integrate ho gaya hai. Unique ID PHP se aayega aur Firebase me chat store hoga!
