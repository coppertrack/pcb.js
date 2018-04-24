const polyfill = require("babel-polyfill");
const pcbStackup = require("pcb-stackup");
const superagent = require("superagent");
const jszip = require("jszip");
const whatsThatGerber = require('whats-that-gerber')

const colorMap = {
  copperFinish: {
    bare: "#C87533",
    gold: "goldenrod",
    nickel: "whitesmoke",
    hasl: "silver",
  },
  solderMask: {
    red: "rgba(139, 0, 0, 0.90)",
    orange: "rgba(195, 107, 0, 0.90)",
    yellow: "rgba(255, 255, 102, 0.50)",
    green: "rgba(0, 68, 0, 0.90)",
    blue: "rgba(0, 30, 104, 0.90)",
    purple: "rgba(46, 0, 81, 0.90)",
    black: "rgba(0, 0, 0, 0.90)",
    white: "rgba(255, 255, 255, 0.90)",
  },
  silkScreen: {
    red: "red",
    yellow: "yellow",
    green: "green",
    blue: "blue",
    black: "black",
    white: "white",
  },
};

function pcbJs(gerbers, options) {
  options = options || {};
  // you can use your own style in the color field or solderMask, silkScreen and copperFinish
  options.color = options.color || getColors(options);
  // pcb-stackup will fill gaps in the outline but is a bit too strict by
  // default in my experience, the units are currently the gerber units but
  // will always be in mm when pcb-stackup is updated to 4.0.0
  options.outlineGapFill = options.outlineGapFill || 0.05;

  if (gerbers.hasOwnProperty('remote')) {
    return getZipFileFromUrl(gerbers.remote).then(function (zip) {
      return stackupZip(zip)
    }).then(function (layers) {
      return stackupGerbers(layers, options);
    });
  }

  if (gerbers.hasOwnProperty('local')) {
    return stackupZip(gerbers.local).then(function (layers) {
      return stackupGerbers(layers, options);
    });
  }
}

function getZipFileFromUrl(url) {
  return superagent
    .get(url)
    .set("accept", "application/zip")
    .responseType("blob")
    .buffer()
    .then(r => r.body)
}

function stackupZip(zip) {
  return jszip.loadAsync(zip)
    .then(zip => {
      const files = [];
      zip.forEach((path, file) => {
        if (!file.dir) {
          const layerType = whatsThatGerber(file)
          files.push(
            file
              .async("text")
              .then(contents => ({
                gerber: contents,
                filename: path,
                options: {
                  filetype: (layerType === 'drl') ? 'drill' : 'gerber'
                }
              }))
          );
        }
      });
      return Promise.all(files);
    })
}

function stackupGerbers(layers, options) {
  return new Promise((resolve, reject) => {
    try {
      pcbStackup(layers, options, (err, stackup) => {
        if (err) {
          return reject(err);
        }

        // If we were unable to calculate the width and height something is wrong
        if (stackup.top.width == 0 || stackup.top.height == 0) {
          return reject(new Error('No outline found'));
        }

        const board_layers = countLayers(stackup.layers, [
          "icu",
          "bcu",
          "tcu",
        ]);

        // If we were unable to count the number of layers something is wrong
        if (board_layers == 0) {
          return reject(new Error('No layers found'));
        }

        let board_width = stackup.top.width;
        let board_length = stackup.top.height;

        // Convert to mm
        if (stackup.top.units == "in") {
          board_width = board_width * 25.4;
          board_length = board_length * 25.4;
        }

        return resolve({
          board_width,
          board_length,
          board_layers,
          stackup,
        });
      });
    }
    catch (e) {
      return reject(e);
    }
  })
}

// turn color options into a pcb stackup color options
function getColors(options) {
  const colors = {
    solderMask: colorMap.solderMask.green,
    silkScreen: colorMap.silkScreen.white,
    copperFinish: colorMap.copperFinish.hasl,
  };
  if (options.solderMask != null) {
    colors.solderMask = colorMap.solderMask[options.solderMask];
  }
  if (options.silkScreen != null) {
    colors.silkScreen = colorMap.silkScreen[options.silkScreen];
  }
  if (options.copperFinish != null) {
    colors.copperFinish = colorMap.copperFinish[options.copperFinish];
  }
  return {
    fr4: "#4D542C",
    cu: "lightgrey",
    cf: colors.copperFinish,
    sm: colors.solderMask,
    ss: colors.silkScreen,
    sp: "rgba(0, 0, 0, 0.0)",
    out: "black",
  };
}

// A function to count the layers of a specific type
function countLayers(layers, types) {
  let count = 0;
  layers.forEach(layer => {
    if (types.indexOf(layer.type) > -1) {
      count++;
    }
  });
  return count;
}

module.exports = pcbJs;
