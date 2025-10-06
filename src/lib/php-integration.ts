// PHP Integration Helper Functions
// Ye functions aapke PHP backend ke saath integrate karne ke liye hain

export interface PHPUser {
  id: string;
  name: string;
  type: 'user' | 'astrologer';
}

export interface PHPChatSession {
  uniqueId: string;
  userId: string;
  astrologerId: string;
  status: 'active' | 'closed';
  createdAt: string;
}

// PHP API calls (ye functions aapke PHP backend se data fetch karenge)
export class PHPIntegration {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // PHP se unique ID aur user details fetch karna
  async getChatSession(uniqueId: string): Promise<PHPChatSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat-session/${uniqueId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat session from PHP:', error);
      return null;
    }
  }

  // PHP se user details fetch karna
  async getUserDetails(userId: string): Promise<PHPUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details from PHP:', error);
      return null;
    }
  }

  // PHP se astrologer details fetch karna
  async getAstrologerDetails(astrologerId: string): Promise<PHPUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/astrologer/${astrologerId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching astrologer details from PHP:', error);
      return null;
    }
  }

  // PHP se new chat session create karna
  async createChatSession(userId: string, astrologerId: string): Promise<PHPChatSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/create-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          astrologerId
        })
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating chat session in PHP:', error);
      return null;
    }
  }

  // PHP se chat sessions list fetch karna
  async getUserChatSessions(userId: string): Promise<PHPChatSession[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user-chats/${userId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching user chat sessions from PHP:', error);
      return [];
    }
  }
}

// Usage Example:
/*
const phpIntegration = new PHPIntegration('https://your-php-backend.com');

// PHP se chat session fetch karna
const session = await phpIntegration.getChatSession('unique_id_from_php');

// PHP se user details fetch karna
const user = await phpIntegration.getUserDetails('user_123');

// PHP se astrologer details fetch karna
const astrologer = await phpIntegration.getAstrologerDetails('astrologer_456');
*/
