# eth_tx_sender

Utility for automating the sending of transactions to the Ethereum blockchain, with the possibility of subsequent modification and tracking the status, without time limit

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install eth_tx_sender.

```bash
npm install eth_tx_sender
```

## Usage

### Simle usage (using default RPC setings)

```js
const txSender = require('eth_tx_sender')

txSender.sendTx({
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
})
//or with promise return
txSender
  .sendTx({
    to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
    amount: 'full',
    privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
  })
  .wait()
  .then(console.log, console.log)

//ERC20 transfer
TxSender.sendERC20({
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  token: '0xdac17f958d2ee523a2206206994597c13d831ec7'
})
```

### Specify RPC settings

```js
const txSender = require('eth_tx_sender')

//test network
txSender.init({
  web3Provider: 'https://ropsten.infura.io/v3/',
  chain: 'ropsten'
})

//BSC test network
sender.init({
  web3Provider: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  chain: 'bnbt'
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
  web3Provider: 'https://ropsten.infura.io/v3/',
  chain: 'ropsten',
  startGasPrice: 1 * 1000000000
})

txSender.sendTx({
  boostInterval: 20,
  to: '0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
  amount: 'full',
  privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
})
```

### Extract web3 library

```js
const TxSender = require('eth_tx_sender')
let web3 = TxSender.web3()
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
