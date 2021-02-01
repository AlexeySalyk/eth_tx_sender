# eth_tx_sender

Utility for automating the sending of transactions to the Ethereum blockchain, with the possibility of subsequent modification and tracking the status, without time limit

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install eth_tx_sender.

```bash
npm install eth_tx_sender
```

## Usage

```js
const TxSender = require('eth_tx_sender');
txSender.SendTx({to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',amount: 'full', privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'});

//or
txSender.SendTx({to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',amount: 'full', privateKey: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'}).wait().then(console.log, console.log);

//ERC20
TxSender.sendERC20({
    to:'0xAC35682eF3eCecF0662d245D5a2429CB7C57bA5B',
    amount:'full',
    privateKey:"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    token:'0xdac17f958d2ee523a2206206994597c13d831ec7'
});

```

## License

[MIT](https://choosealicense.com/licenses/mit/)
