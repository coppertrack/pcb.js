# pcb.js

pcb.js is a browser implementation of pcb-stackup. It takes both local and
remote zip-files as input and converts it to SVG images. We aim to support
other sources of input in the future too.

Install with:

```
$ npm install
```

or build your own version with the help of `browserify`:

```
npm run build-dist
```

This will create pcb.js in the `dist` folder.

## Usage

```javascript
var gerbers = { remote: url };
var options = { id: 'my-board' };
var circuitboard = pcbjs(gerbers, options).then(function process(pcb) {
  // pcb contains board_layers, board_width, board_length and the pcb-stackup
  // object, e.g. pcb.stackup.top.svg.
}).catch(function(error) {
  console.error(error)
});
```

Choosing your own id helps when styling the output with css.

## Error handling

Errors are part of the Promise return by `pcbjs`. For example:

```javascript
.catch(function(error) {
  if (error.message.match(/End of data reached/g)) {
    console.error('Incorrect zip file')
  }
});
```

## Styling

[See pcb-stackup-core docs](https://github.com/tracespace/pcb-stackup-core/blob/master/README.md#color) for more details
and additional colour options. Colours can be set in the `options` object.

You can also change the colour using css.

layer | classname   | example (id = 'my-board')
------|-------------|-------------------------------------------------
fr4   | id + `_fr4` | `.my-board_fr4 {color: #666;}`
cu    | id + `_cu`  | `.my-board_cu {color: #ccc;}`
cf    | id + `_cf`  | `.my-board_cf {color: #c93;}`
sm    | id + `_sm`  | `.my-board_sm {color: #rgba(0, 66, 0, 0.75);}`
ss    | id + `_ss`  | `.my-board_ss {color: #fff;}`
sp    | id + `_sp`  | `.my-board_sp {color: #999;}`
out   | id + `_out` | `.my-board_out {color: #000;}`

## API

## pcbjs(config, [options]): `function`

Parameter | Type              | Description
----------|-------------------|------------
gerbers   | <Gerbers>         | Gerber files
options   | <Options>         | `pcb-stackup-core` options

### gerbers: `object`

Name      | Type     | Default | Description
----------|----------|---------|------------
remote    | `string` |         | Set a remote file to process
local     | `File`   |         | Set a local File to process

`remote` will take precedence over `local`.

### options: `object`

[See pcb-stackup-core docs](https://github.com/tracespace/pcb-stackup-core/blob/master/README.md#options) for more details and additional options

## Development

We strongly believe in the power of open source. This module is our way
of saying thanks.

If you want to contribute please:

1. Fork the repository.
2. Push to your fork and submit a pull request.
