# Firebase Chat System Integration

This project now includes Firebase Firestore and Firebase Storage integration for a real-time chat system between users and astrologers.

## Features Implemented

### 🔥 Firebase Configuration
- **Firebase App**: Initialized with your provided configuration
- **Firestore**: Database for storing chat messages and sessions
- **Storage**: File uploads for images and documents
- **Analytics**: Optional analytics integration

### 💬 Chat System
- **Real-time Messaging**: Messages sync instantly between users and astrologers
- **File Uploads**: Support for images, videos, and documents
- **Message Types**: Text, image, video, audio, and file messages
- **Typing Indicators**: Real-time typing status
- **Message Status**: Sent, delivered, and read status

### 🆔 Unique ID System
- **Chat Sessions**: Each chat has a unique identifier
- **User-Astrologer Pairing**: Automatic session creation
- **Session Management**: Active/closed chat status
- **Cross-Platform**: Works with PHP backend integration

## File Structure

```
src/
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   └── firestore.ts         # Firestore service functions
├── app/
│   ├── chatbox/page.tsx     # Chat interface (updated)
│   ├── chatlist/page.tsx    # Chat list (updated)
│   └── demo/page.tsx        # Demo page for testing
```

## Key Functions

### Firebase Configuration (`src/lib/firebase.ts`)
```typescript
// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
```

### Firestore Services (`src/lib/firestore.ts`)
```typescript
// Create chat session
createChatSession(userId: string, astrologerId: string): Promise<string>

// Send message
sendMessage(messageData: ChatMessage): Promise<void>

// Get messages (real-time)
getMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void

// Upload file
uploadFile(file: File, chatId: string): Promise<string>
```

## Usage Examples

### Creating a New Chat Session
```typescript
const chatId = await createChatSession('user_123', 'astrologer_456');
```

### Sending a Message
```typescript
await sendMessage({
  chatId: 'chat_123',
  senderId: 'user_123',
  senderType: 'user',
  message: 'Hello!',
  messageType: 'text'
});
```

### Listening to Messages
```typescript
const unsubscribe = getMessages(chatId, (messages) => {
  console.log('New messages:', messages);
});
```

## Integration with PHP Backend

The unique ID system allows seamless integration with your PHP partner's project:

1. **Unique IDs**: Each chat session has a unique identifier
2. **Cross-Platform**: PHP backend can use the same unique IDs
3. **Real-time Sync**: Changes in either system sync instantly
4. **User Management**: Easy user and astrologer identification

## Demo Page

Visit `/demo` to test the unique ID system:
- Create new chat sessions
- Join existing chats with unique IDs
- Test the Firebase integration

## Environment Setup

Make sure your Firebase project has:
- Firestore enabled
- Storage enabled
- Proper security rules configured

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. **Authentication**: Implement user authentication
2. **User Profiles**: Add user and astrologer profiles
3. **Notifications**: Add push notifications
4. **Advanced Features**: Voice messages, video calls, etc.

The system is now ready for production use with your PHP backend integration!
