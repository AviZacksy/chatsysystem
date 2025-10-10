import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  serverTimestamp,
  updateDoc,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Chat message interface
export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'astrologer';
  message: string;
  timestamp: Date | Timestamp | FieldValue;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

// Chat session interface
export interface ChatSession {
  id: string;
  userId: string;
  astrologerId: string;
  createdAt: Date | Timestamp | FieldValue;
  lastMessage?: string;
  lastMessageTime?: Date | Timestamp;
  status: 'active' | 'closed';
  uniqueId: string; // This will be the unique identifier for the chat
}

// Chat request interface
export interface ChatRequest {
  id?: string;
  uniqueId: string;
  userId: string;
  astrologerId: string; // astrologer sno
  userName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | Timestamp | FieldValue;
}

// Create a new chat session with external unique ID from PHP
export const createChatSession = async (userId: string, astrologerId: string, externalUniqueId: string): Promise<string> => {
  const chatSession: Omit<ChatSession, 'id'> = {
    userId,
    astrologerId,
    createdAt: serverTimestamp(),
    status: 'active',
    uniqueId: externalUniqueId // Use the unique ID from PHP system
  };

  const docRef = await addDoc(collection(db, 'chatSessions'), chatSession);
  return docRef.id;
};

// (unused) generateUniqueId removed

// Send a message
export const sendMessage = async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> => {
  const { fileUrl, fileName, ...rest } = messageData;
  const message: Omit<ChatMessage, 'id'> = {
    ...rest,
    ...(fileUrl ? { fileUrl } : {}),
    ...(fileName ? { fileName } : {}),
    timestamp: serverTimestamp()
  };

  await addDoc(collection(db, 'messages'), message as ChatMessage);
  
  // Update chat session with last message
  await updateChatSessionLastMessage(messageData.chatId, messageData.message);
};

// Update chat session with last message
const updateChatSessionLastMessage = async (chatId: string, lastMessage: string): Promise<void> => {
  const chatSessionRef = doc(db, 'chatSessions', chatId);
  await updateDoc(chatSessionRef, {
    lastMessage,
    lastMessageTime: serverTimestamp()
  });
};

// Get messages for a chat
export const getMessages = (chatId: string, callback: (messages: ChatMessage[]) => void): () => void => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage);
    });
    callback(messages);
  });
};

// Get chat sessions for a user
export const getUserChatSessions = async (userId: string, userType: 'user' | 'astrologer'): Promise<ChatSession[]> => {
  const chatSessionsRef = collection(db, 'chatSessions');
  const field = userType === 'user' ? 'userId' : 'astrologerId';
  const q = query(
    chatSessionsRef,
    where(field, '==', userId),
    orderBy('lastMessageTime', 'desc')
  );

  const snapshot = await getDocs(q);
  const sessions: ChatSession[] = [];
  snapshot.forEach((doc) => {
    sessions.push({
      id: doc.id,
      ...doc.data()
    } as ChatSession);
  });

  return sessions;
};

// Get chat session by unique ID from PHP system
export const getChatSessionByUniqueId = async (uniqueId: string): Promise<ChatSession | null> => {
  const chatSessionsRef = collection(db, 'chatSessions');
  const q = query(chatSessionsRef, where('uniqueId', '==', uniqueId));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as ChatSession;
};

// Get or create chat session with PHP unique ID
export const getOrCreateChatSession = async (uniqueId: string, userId: string, astrologerId: string): Promise<ChatSession> => {
  // First try to find existing session
  let session = await getChatSessionByUniqueId(uniqueId);
  
  if (!session) {
    // Create new session with PHP unique ID
    const chatId = await createChatSession(userId, astrologerId, uniqueId);
    session = await getChatSessionByUniqueId(uniqueId);
  }
  
  if (!session) {
    throw new Error('Failed to create or find chat session');
  }
  
  return session;
};

// Close chat session
export const closeChatSession = async (chatId: string): Promise<void> => {
  const chatSessionRef = doc(db, 'chatSessions', chatId);
  await updateDoc(chatSessionRef, {
    status: 'closed'
  });
};

// Upload file to Firebase Storage
export const uploadFile = async (file: File, chatId: string): Promise<string> => {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const storage = getStorage();
  
  const fileName = `${chatId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

// ========== Chat Requests (request-based workflow) ==========

// Create a new chat request (if one pending for same uniqueId doesn't exist)
export const createChatRequest = async (uniqueId: string, userId: string, astrologerId: string, userName?: string): Promise<string> => {
  const chatRequestsRef = collection(db, 'chatRequests');
  // check existing pending
  const existing = await getDocs(query(chatRequestsRef, where('uniqueId', '==', uniqueId), where('status', '==', 'pending')));
  if (!existing.empty) {
    return existing.docs[0].id;
  }
  const docRef = await addDoc(chatRequestsRef, {
    uniqueId,
    userId,
    astrologerId,
    userName,
    status: 'pending',
    createdAt: serverTimestamp()
  } as ChatRequest);
  return docRef.id;
};

// Listen to requests for an astrologer
export const listenChatRequests = (astrologerId: string, callback: (requests: ChatRequest[]) => void): (() => void) => {
  const chatRequestsRef = collection(db, 'chatRequests');
  const q = query(chatRequestsRef, where('astrologerId', '==', astrologerId));
  return onSnapshot(q, (snap) => {
    const reqs: ChatRequest[] = [];
    snap.forEach((d) => reqs.push({ id: d.id, ...(d.data() as Omit<ChatRequest, 'id'>) }));
    // Sort by createdAt on client side to avoid index requirement
    reqs.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                   (a.createdAt as Timestamp)?.toDate ? (a.createdAt as Timestamp).toDate().getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                   (b.createdAt as Timestamp)?.toDate ? (b.createdAt as Timestamp).toDate().getTime() : 0;
      return bTime - aTime; // Descending order
    });
    callback(reqs);
  });
};

// Accept a request → create/get session and set status accepted. Also send astrologer welcome message.
export const acceptChatRequest = async (requestId: string, welcomeMessage: string): Promise<ChatSession> => {
  const reqRef = doc(db, 'chatRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error('Chat request not found');
  const data = reqSnap.data() as ChatRequest;

  // create or get session using base uniqueId (not requestId)
  const session = await getOrCreateChatSession(data.uniqueId, data.userId, data.astrologerId);

  // mark accepted
  await updateDoc(reqRef, { status: 'accepted' });

  // send welcome as astrologer
  await sendMessage({
    chatId: session.id,
    senderId: data.astrologerId,
    senderType: 'astrologer',
    message: welcomeMessage,
    messageType: 'text'
  });

  return session;
};

export const rejectChatRequest = async (requestId: string): Promise<void> => {
  const reqRef = doc(db, 'chatRequests', requestId);
  await updateDoc(reqRef, { status: 'rejected' });
};

// Listen a single chat request document by id
export const listenChatRequestById = (requestId: string, callback: (request: ChatRequest | null) => void): (() => void) => {
  const reqRef = doc(db, 'chatRequests', requestId);
  return onSnapshot(reqRef, (snap) => {
    if (!snap.exists()) return callback(null);
    callback({ id: snap.id, ...(snap.data() as Omit<ChatRequest, 'id'>) });
  });
};
