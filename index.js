const pcbStackup = require("pcb-stackup");
const superagent = require("superagent");
const binaryParser = require("superagent-binary-parser");
const jszip = require("jszip");

function pcbStackupZip(url, options) {
  options = options || {};
  // you can use your own style in the color field or solderMask, silkScreen and copperFinish
  options.color = options.color || getColors(options);
  // pcb-stackup will fill gaps in the outline but is a bit too strict by
  // default in my experience, the units are currently the gerber units but
  // will always be in mm when pcb-stackup is updated to 4.0.0
  options.outlineGapFill = options.outlineGapFill || 0.05;
  // we use this id to apply the styles
  options.id = "pcb-stackup";
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
          pcbStackup(layers, options, (err, stackup) => {
            if (err) {
              return reject(err);
            }
            const board_layers = countLayers(stackup.layers, ['icu', 'bcu', 'tcu']);
            return resolve({ board_layers, stackup });
          });
        })
    );
}

const colourMap = {
  copperFinish: {
    bare: "#C87533",
    gold: "goldenrod",
    nickel: "whitesmoke",
    hasl: "silver",
  },
  solderMask: {
    red: "rgba(139,   0,   0, 0.90)",
    orange: "rgba(195, 107,   0, 0.90)",
    yellow: "rgba(255, 255, 102, 0.50)",
    green: "rgba(  0,  68,   0, 0.90)",
    blue: "rgba(  0,  30, 104, 0.90)",
    purple: "rgba( 46,   0,  81, 0.90)",
    black: "rgba(  0,   0,   0, 0.90)",
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

// turn color options into a CSS style string
function getColors(options) {
  const colors = {
    solderMask: colourMap.solderMask.green,
    silkScreen: colourMap.silkScreen.white,
    copperFinish: colourMap.copperFinish.hasl,
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
  return `.pcb-stackup_fr4 {color: #4D542C;}
  .pcb-stackup_cu {color: lightgrey;}
  .pcb-stackup_cf {color: ${colors.copperFinish};}
  .pcb-stackup_sm {color: ${colors.solderMask};}
  .pcb-stackup_ss {color: ${colors.silkScreen};}
  .pcb-stackup_sp {color: rgba(0, 0, 0, 0.0);}
  .pcb-stackup_out {color: black;}`;
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

module.exports = pcbStackupZip;
