// global.d.ts

declare global {
    namespace NodeJS {
      interface Global {
        _mongoClientPromise: Promise<import('mongodb').MongoClient>;
      }
    }
  }
  
  // If this file is a module (e.g. contains `import` or `export`), add this line:
  export {};