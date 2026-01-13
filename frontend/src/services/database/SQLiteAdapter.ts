import { DatabaseAdapter, ChatSession, ChatMessage } from './types';

/**
 * SQLite adapter using IndexedDB as the underlying storage
 * This simulates SQLite behavior in the browser using IndexedDB
 * Can be replaced with actual SQLite (sql.js) or any hosted database
 */
export class SQLiteAdapter implements DatabaseAdapter {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'leapsql_chat_history';
    private readonly DB_VERSION = 1;

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    sessionsStore.createIndex('databaseName', 'databaseName', { unique: false });
                    sessionsStore.createIndex('userId', 'userId', { unique: false });
                }

                // Create messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
                    messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async createSession(userId: string, databaseName: string, title?: string): Promise<ChatSession> {
        if (!this.db) throw new Error('Database not initialized');

        const session: ChatSession = {
            id: this.generateId(),
            userId,
            title: title || `Chat ${new Date().toLocaleDateString()}`,
            databaseName,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');

            const request = store.add({
                ...session,
                createdAt: session.createdAt.toISOString(),
                updatedAt: session.updatedAt.toISOString(),
            });

            request.onsuccess = () => resolve(session);
            request.onerror = () => reject(new Error('Failed to create session'));
        });
    }

    async getSessions(userId: string): Promise<ChatSession[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.getAll();

            request.onsuccess = () => {
                const allSessions = request.result;
                // Filter by userId and sort by createdAt descending
                const userSessions = allSessions
                    .filter((data: any) => data.userId === userId)
                    .map((data: any) => ({
                        ...data,
                        createdAt: new Date(data.createdAt),
                        updatedAt: new Date(data.updatedAt),
                    }))
                    .sort((a: ChatSession, b: ChatSession) =>
                        b.createdAt.getTime() - a.createdAt.getTime()
                    );
                resolve(userSessions);
            };

            request.onerror = () => reject(new Error('Failed to get sessions'));
        });
    }

    async getSession(id: string): Promise<ChatSession | null> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.get(id);

            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    resolve({
                        ...data,
                        createdAt: new Date(data.createdAt),
                        updatedAt: new Date(data.updatedAt),
                    });
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => reject(new Error('Failed to get session'));
        });
    }

    async updateSessionTitle(id: string, title: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const session = await this.getSession(id);
        if (!session) throw new Error('Session not found');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');

            const request = store.put({
                ...session,
                title,
                updatedAt: new Date().toISOString(),
                createdAt: session.createdAt.toISOString(),
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to update session'));
        });
    }

    async deleteSession(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // First delete all messages for this session
        const messages = await this.getMessages(id);
        for (const message of messages) {
            await this.deleteMessage(message.id);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete session'));
        });
    }

    async addMessage(
        sessionId: string,
        userQuery: string,
        sqlQuery: string,
        result: Record<string, any>[] | null
    ): Promise<ChatMessage> {
        if (!this.db) throw new Error('Database not initialized');

        const message: ChatMessage = {
            id: this.generateId(),
            sessionId,
            userQuery,
            sqlQuery,
            result,
            createdAt: new Date(),
        };

        // Update session's updatedAt timestamp
        const session = await this.getSession(sessionId);
        if (session) {
            await this.updateSessionTitle(sessionId, session.title); // This also updates updatedAt
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');

            const request = store.add({
                ...message,
                createdAt: message.createdAt.toISOString(),
                result: JSON.stringify(result),
            });

            request.onsuccess = () => resolve(message);
            request.onerror = () => reject(new Error('Failed to add message'));
        });
    }

    async getMessages(sessionId: string): Promise<ChatMessage[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('sessionId');
            const request = index.getAll(sessionId);

            request.onsuccess = () => {
                const messages = request.result.map((data: any) => ({
                    ...data,
                    createdAt: new Date(data.createdAt),
                    result: data.result ? JSON.parse(data.result) : null,
                }));
                // Sort by createdAt ascending
                messages.sort((a: ChatMessage, b: ChatMessage) =>
                    a.createdAt.getTime() - b.createdAt.getTime()
                );
                resolve(messages);
            };

            request.onerror = () => reject(new Error('Failed to get messages'));
        });
    }

    async deleteMessage(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete message'));
        });
    }
}
