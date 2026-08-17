import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || 'mongodb://localhost/mock';

let client;
let clientPromise;

if (!global._coursepilotMongoClientPromise) {
    try {
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
        global._coursepilotMongoClientPromise = client.connect().catch(err => {
            console.warn('[AI Studio] MongoDB not connected — some features may not work');
            return null;
        });
    } catch (e) {
        console.warn('[AI Studio] Failed to initialize MongoClient:', e.message);
        global._coursepilotMongoClientPromise = Promise.resolve(null);
    }
}

clientPromise = global._coursepilotMongoClientPromise;

export async function getDatabase() {
    const connectedClient = await clientPromise;
    if (!connectedClient) {
        throw new Error("MongoDB offline");
    }
    return connectedClient.db();
}