const ps = require('path');
import React from 'react';
import * as IDB from  './indexeddb'
import memoryContext from './filesystem';
import { Button } from '@nextui-org/react';

const API = {
    _createGitTree(fs: typeof import('fs')) {
        return null;
    }
};
async function getOrCreateGithubToken() {
  let resultingArray = [];
  let db = await IDB.DB();
  let transaction = db.transaction(["user-secret"], 'readwrite');
  let usrSecret = transaction.objectStore('user-secret');
  let ghToken = await usrSecret.get("github-token");
  if (!ghToken) {
    
  }
}
const GitPanel: React.FC = () => {
  const handlePush = () => {
    // TODO: Implement push functionality
    

  };

  const handlePull = () => {
    // TODO: Implement pull functionality
    alert('Pull clicked');
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexDirection: 'column' }}>
      <Button onPress={handlePush} style={{ padding: '0.5rem 1rem' }}>Push</Button>
      <Button onPress={handlePull} style={{ padding: '0.5rem 1rem' }}>Pull</Button>
    </div>
  );
};

export {
  API,
  GitPanel
}