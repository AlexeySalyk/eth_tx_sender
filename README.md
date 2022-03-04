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
const TxSender = require('eth_tx_sender');

txSender.SendTx({to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',amount: 'full', privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'});
//or with promise return
txSender.SendTx({to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',amount: 'full', privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'}).wait().then(console.log, console.log);

//ERC20 transfer
TxSender.sendERC20({
    to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
    amount:'full',
    privateKey:"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    token:'0xdac17f958d2ee523a2206206994597c13d831ec7'
});
```

### Specify RPC settings
```js
const TxSender = require('eth_tx_sender');

//test network
txSender.init( {
    web3Provider: 'https://ropsten.infura.io/v3/',
    chain: 'ropsten',
    startGasPrice: 1*1000000000
});

//BSC test network
sender.init( {
    web3Provider: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chain: 'bnbt',
    startGasPrice: 10*1000000000
});

//Send transaction
txSender.SendTx({to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',amount: 'full', privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'});
```

### Extract web3 library
```js
const TxSender = require('eth_tx_sender');
let web3 = TxSender.web3();
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
