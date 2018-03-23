const pcbStackupZip = require("../index");
const url = 'gerbers.zip'

console.log(`fetching ${url}`);

pcbStackupZip(url, {
  solderMask: "white",
  silkScreen: "black",
  copperFinish: "gold",
}).then(out => {
  const pre = document.createElement('pre')
  pre.innerText = JSON.stringify(out, null, 2)
  document.getElementById('root').append(pre)
})
