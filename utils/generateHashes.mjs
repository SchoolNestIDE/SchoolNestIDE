import * as crypto from 'crypto';
import * as fs from 'fs';
import * as p from 'path';
import * as process from 'process';
function walk(path, recursiveCB, endCB) {
    return new Promise((resolve) => {
        fs.readdir(path, (_, files) => {
            Promise.all(files.map((file, i, arr) => {
                return new Promise((resolve) => {
                    let fd = p.normalize(path + p.sep + file);
                    fs.stat(fd, (err, stat) => {
                        //console.log(err);
                        if (stat.isDirectory()) {
                            walk(fd, recursiveCB, () => { }).then(resolve);
                        }
                        else {
                            recursiveCB(fd).then(() => {
                                resolve();
                            });
                        }
                    });
                });
            })).then(() => {
                endCB();
                resolve();
            });
        });
    });
}
function removeTrailingSlashes(path) {
    return path.replace(/\/+$/, '');
}
function stripFirstPathComponent(inputPath) {
    const normalizedPath = p.normalize(inputPath);
    const parts = normalizedPath.split(p.sep);
  
    if (parts.length <= 1) {
      return '';
    }
  
    return parts.slice(1).join(p.sep);
}
let obj = {};
console.log(process.argv)
const inputtedPath = removeTrailingSlashes(p.normalize(process.argv[2]));
walk(inputtedPath, async (path) => {
    return new Promise((resolve) => {
        fs.readFile(path, (err, data) => {
            let md = crypto.hash("SHA-256", new Uint8Array(data), 'hex');
            console.log(md);
	    let mc = path.split(inputtedPath)[1];
            obj[mc] = md;
            resolve();
        });
    });
}, () => {
    fs.writeFileSync(inputtedPath + p.sep + "hashes.json", JSON.stringify(obj, null, 2));
});
