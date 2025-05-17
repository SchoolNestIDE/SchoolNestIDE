
const ps = require('path');

function walk(fs: typeof import('fs'), path: string, recursiveCB: (parent: string, filename: string, stat: import('fs').Stats, depth: number) => Promise<void>, endCB: () => void, depth: number = 0) {
  return new Promise<void>((resolve) => {
    fs.readdir(path, (_, files) => {
      Promise.all<void>(files.map((file, i, arr) => {
        return new Promise((resolve) => {
          let fd = path + ps.sep + file;
          if (file === "/") {
            resolve();
            return;
          }
          fs.stat(fd, async (err, stat) => {
            await recursiveCB(path, file, stat, depth);
            if (stat.isDirectory()) {
              walk(fs, fd, recursiveCB, () => { }, depth + 1).then(resolve);

            } else {
              resolve();
            };
          })
        });
      })).then(() => {
        endCB();
        resolve();
      })


    })
  });
}

const API = {
    _createGitTree(fs: typeof import('fs')) {
        return null;
    }
};

function GitPanel (params: {
  none: string
}) {
  return (
    <>
    <h1>Hi</h1>
    </>
  )
}
export {
  API,
  GitPanel
}