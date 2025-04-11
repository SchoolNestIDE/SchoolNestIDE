// lib/mongodb.ts

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://atharun:SchoolNestClientProject@schoolnestclientcluster.slnat0f.mongodb.net/?retryWrites=true&w=majority&appName=SchoolNestClientCluster"


const options = {};

const env = "development"

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (env === 'development') {
  // In development mode, use a global variable to preserve the client
  // across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
