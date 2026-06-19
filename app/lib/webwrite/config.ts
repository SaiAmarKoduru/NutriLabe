import { Client, Account, Databases } from 'node-appwrite';

const createAdminClient = () => {
    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject('6738b051000cca16a5ef')
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
};

const createSessionClient = (sessionId?: string) => {
    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject('6738b051000cca16a5ef');

    if (sessionId) {
        client.setSession(sessionId);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
};

export const DATABASE_ID = 'blog';
export const POSTS_COLLECTION_ID = 'posts';

export { createAdminClient, createSessionClient };
