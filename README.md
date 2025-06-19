# eth_tx_sender

Utility for automating the sending of transactions to the Ethereum blockchain, with the possibility of subsequent modification and tracking the status, without time limit

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install eth_tx_sender.

```bash
npm install eth_tx_sender
```

## Usage

### Simle usage (using default RPC setings)

Just send the transaction and go ahead (without waiting the result).  
If during the tx sending the transaction is refused by the node, or there will be an internal error, it will be ignored and your code won't be thrown.  
Returns tx object with all the functions inside.
```js
const txSender = require('eth_tx_sender')
 
txSender.sendTx({
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
})
```

you can also wait for the result via Promise

```js
txSender
  .sendTx({
    to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
    amount: 'full',
    privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
  })
  .wait()
  .then(console.log, console.error);
```

or send ERC20 transfer (the same logic)
```js
TxSender.sendERC20({
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  token: '0xdac17f958d2ee523a2206206994597c13d831ec7' //USDT
})
```

In case of using .wait() method it returns a Promise which will be resolved after the transaction is mined, it also includes an internal "sendToNodePromise" promise which will be resolved after the transaction is sent to the node to catching internal errors.

### Specify RPC settings

```js
const txSender = require('eth_tx_sender')

//test network
txSender.init({
  web3Provider: 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
  chain: 'gor' //or 'goerli'
})

//BSC test network
sender.init({
  web3Provider: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  chain: 'bnbt' //BNB testnet
})

//using websocket
txSender.init({
  web3Provider: '"wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID"',
  chain: 'gor'
})

//Send transaction
txSender.sendTx({
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
})
```

### Send with gas boosting

```js
txSender.init({
  web3Provider: 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
  chain: 'gor',
  startGasPrice: 1 * 1000000000
})

txSender.sendTx({
  boostInterval: 20,
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
})
```

### Initialization parameters description `init()` method

* {Object} `web3` - (optional) web3 library instance, by default new instance will be created
* {string} `web3Provider` - (optional) default 'http://localhost:8545'
* {string} `chain` - (optional) (ropsten/mainnet or chain short name from https://chainid.network/) by default mainnet
* {Number} `gasPriceStep` - (optional) gas price multiplier (used when speeding up the transaction), by default 10%
* {Number} `startGasPrice` - (optional) tx gas price, default null, will be taken from RPC
* {Number} `boostInterval` - (optional) boost interval in seconds, default 0 (auto forcing disabled)
* {Boolean} `retryFailedTx` - (optional) resend transaction refused by RPC, default false.
* {Boolean} `calcHashAnyway` - (optional) calculate tx hash even if tx refused by RPC, default true.
* {Function} `log` - (optional) log function, default console.log
* {Function} `logError` - (optional) error log function, default console.error

### Extract a web3 library

```js
const TxSender = require('eth_tx_sender')
let web3 = TxSender.web3()
```

### Disable logging

```js
const TxSender = require('eth_tx_sender')
TxSender.init({
  log: () => {},
  logError: () => {}
})
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
