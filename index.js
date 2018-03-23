const pcbStackup = require("pcb-stackup");
const superagent = require("superagent");
const binaryParser = require("superagent-binary-parser");
const jszip = require("jszip");

function pcbStackupZip(url, options) {
  return superagent
    .get(url)
    .set("accept", "application/zip")
    .parse(binaryParser)
    .buffer()
    .then(r => r.body)
    .then(jszip.loadAsync)
    .then(zip => {
      const files = [];
      zip.forEach((path, file) => {
        if (!file.dir) {
          files.push(
            file
              .async("text")
              .then(contents => ({ gerber: contents, filename: path }))
          );
        }
      });
      return Promise.all(files);
    })
    .then(
      layers =>
        new Promise((resolve, reject) => {
          pcbStackup(layers, options || {}, (err, stackup) => {
            if (err) {
              return reject(err);
            } else {
              return resolve(stackup);
            }
          });
        })
    );
}

module.exports = pcbStackupZip;
