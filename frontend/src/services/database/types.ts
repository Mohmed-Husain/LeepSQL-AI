// Database abstraction types - designed for future migration to any hosted DB

export interface ChatSession {
    id: string;
    title: string;
    databaseName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    userQuery: string;
    sqlQuery: string;
    result: Record<string, any>[] | null;
    createdAt: Date;
}

export interface DatabaseAdapter {
    // Session operations
    createSession(databaseName: string, title?: string): Promise<ChatSession>;
    getSessions(): Promise<ChatSession[]>;
    getSession(id: string): Promise<ChatSession | null>;
    updateSessionTitle(id: string, title: string): Promise<void>;
    deleteSession(id: string): Promise<void>;

    // Message operations
    addMessage(sessionId: string, userQuery: string, sqlQuery: string, result: Record<string, any>[] | null): Promise<ChatMessage>;
    getMessages(sessionId: string): Promise<ChatMessage[]>;
    deleteMessage(id: string): Promise<void>;

    // Initialization
    initialize(): Promise<void>;
    close(): Promise<void>;
}
