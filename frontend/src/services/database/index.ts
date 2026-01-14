import { DatabaseAdapter } from './types';
import { SQLiteAdapter } from './SQLiteAdapter';

export * from './types';
export { SQLiteAdapter } from './SQLiteAdapter';

/**
 * Database service factory
 * 
 * This factory allows easy switching between different database backends.
 * To connect to a hosted database in the future, simply:
 * 1. Create a new adapter implementing DatabaseAdapter interface
 * 2. Update the createDatabaseAdapter function to return your new adapter
 * 
 * Example adapters you could create:
 * - PostgresAdapter (connects to hosted PostgreSQL)
 * - SupabaseAdapter (connects to Supabase)
 * - FirebaseAdapter (connects to Firebase Firestore)
 * - MongoDBAdapter (connects to MongoDB Atlas)
 */

export type DatabaseType = 'sqlite' | 'postgres' | 'supabase' | 'firebase' | 'mongodb';

interface DatabaseConfig {
    type: DatabaseType;
    connectionString?: string;
    apiKey?: string;
    projectId?: string;
}

let currentAdapter: DatabaseAdapter | null = null;

export async function createDatabaseAdapter(config?: DatabaseConfig): Promise<DatabaseAdapter> {
    const type = config?.type || 'sqlite';

    switch (type) {
        case 'sqlite':
        default:
            // Using IndexedDB-based SQLite adapter for local storage
            const adapter = new SQLiteAdapter();
            await adapter.initialize();
            currentAdapter = adapter;
            return adapter;

        // Future implementations:
        // case 'postgres':
        //   const postgresAdapter = new PostgresAdapter(config.connectionString);
        //   await postgresAdapter.initialize();
        //   return postgresAdapter;
        //
        // case 'supabase':
        //   const supabaseAdapter = new SupabaseAdapter(config.connectionString, config.apiKey);
        //   await supabaseAdapter.initialize();
        //   return supabaseAdapter;
    }
}

export function getCurrentAdapter(): DatabaseAdapter | null {
    return currentAdapter;
}

export async function closeDatabaseConnection(): Promise<void> {
    if (currentAdapter) {
        await currentAdapter.close();
        currentAdapter = null;
    }
}
