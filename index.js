const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
let Common = require('@ethereumjs/common').default;
const chains = require('./chains');

let web3 = null;
let defaultChain = 'mainnet';
let gasPriceStep = 10; //percent
let startGasPrice = null;
let retryFailedTx = false;
let boostInterval = 0;
let calcHashAnyway = true;

/**
 * Initialize Transaction sender
 * @param {Object} param default params
 * @param {Object} param.web3 already initialized web3 library [optional]
 * @param {string} param.web3Provider default 'http://localhost:8545'
 * @param {string} param.chain (ropsten/mainnet or chain short name from https://chainid.network/)  default mainnet 
 * @param {Number} param.gasPriceStep gas price multiplier (used when speeding up the transaction), by default 10%
 * @param {Number} param.startGasPrice tx gas price, default null.
 * @param {Number} param.boostInterval boost interval in seconds, default 0 (auto forcing disabled)
 * @param {Boolean} param.retryFailedTx resend transaction refused by RPC, default false.
 * @param {Boolean} param.calcHashAnyway calculate tx hash even if tx refused by RPC, default true.
 */
function init(param = {}) {
    if (param.web3) {
        web3 = param.web3;
        return;
    }
    if (!web3) web3 = new Web3('http://localhost:8545');
    if (param.web3Provider) web3.setProvider(new web3.providers.HttpProvider(param.web3Provider));
    if (param.chain) defaultChain = param.chain;
    if (param.gasPriceStep) gasPriceStep = param.gasPriceStep;
    if (param.startGasPrice) startGasPrice = param.startGasPrice;
    if (param.boostInterval) boostInterval = param.boostInterval;
    if (param.retryFailedTx) retryFailedTx = param.retryFailedTx;
    if (param.calcHashAnyway != undefined) calcHashAnyway = param.calcHashAnyway;
}

function checkWeb3Initialization() {
    if (!web3) throw new Error('web3 is not initialized, assign web3 library or initialize it calling init() method');
    if (!web3.currentProvider) throw new Error('web3 passed is not initialized, please set web3 provider');
}

/**
 * Send ethereum transaction with minimal data
    * @param {Object} param Transaction params object
    * @param {string} param.id optional ID of transaction for tracing
    * @param {string} param.to tx destination 
    * @param {*} param.amount transfer amount, full/all can be accepted
    * @param {string} param.msgData default 0x (empty value)
    * @param {*} param.gasPrice if null using startGasPrice, "auto" for RPC value 
    * @param {Number} param.gasEstimate
    * @param {*} param.nonce pending, latest can be accepted
    * @param {string} param.privateKey 0x...
    * @param {string} param.senderAddress 0x... Be careful inside there is no check for correspondence of the private key to the account!!!
    * @param {string} param.chain  (ropsten/mainnet or chain short name from https://chainid.network/) default mainnet or defaultChain before passed
    * @param {Account} param.account account object in proprietary format (https://www.npmjs.com/package/eth_account)
    * @param {Number} param.boostInterval boost interval in seconds, default 0 (auto forcing disabled)
    * @param {Boolean} param.retryFailedTx resend transaction refused by RPC, default false.    
    * @returns {object} transaction object
 */
function sendTx(param) {
    init();
    let tx = new Transaction(param);
    tx.send().then(() => {
        if (tx.txData.boostInterval > 0) tx.boosting();
    });
    return tx;
}

/**
 * Send ethereum ERC20 token transfer transaction with minimal data
    * @param {Object} param Transaction params object
    * @param {string} param.id optional ID of transaction for tracing
    * @param {string} param.to token transer destination 
    * @param {*} param.amount token transfer amount, full/all can be accepted
    * @param {string} param.token token address
    * @param {*} param.gasPrice
    * @param {Number} param.gasEstimate
    * @param {*} param.nonce pending, latest can be accepted
    * @param {string} param.privateKey 0x...
    * @param {string} param.senderAddress 0x... Be careful inside there is no check for correspondence of the private key to the account!!!
    * @param {string} param.chain  (ropsten/mainnet or chain short name from https://chainid.network/)  default mainnet or defaultChain before passed
    * @param {Account} param.account account object in proprietary format (https://www.npmjs.com/package/eth_account)
    * @param {Number} param.boostInterval boost interval in seconds, default 0 (auto forcing disabled)
    * @param {Boolean} param.retryFailedTx resend transaction refused by RPC, default false.
    * @returns {object} transaction object
 */
function sendERC20(param) {
    init();
    let tx = new Transaction(param);
    tx.sendERC20(param.token, param.to, param.amount);
    return tx;
}

async function sendTxAsync(param) {
    init();
    let tx = new Transaction(param);
    await tx.send();
    if (tx.txData.boostInterval > 0) tx.boosting();
    return tx;
}

/**
 * Checking a transaction by hash
 * @param {String} hash 
 * @param {Function} callback Optional Callback function(error,result)
 * @returns {Object} {result,receipt} result can be "not found", "pending", "mined" 
 */
async function checkTxHash(hash, callback = null) {
    if (typeof hash !== 'string') throw new Error('hash is not a string');
    init();
    var promise = new Promise((resolve, reject) => {
        web3.eth.getTransaction(hash, (err, tx) => {
            if (err) reject(err.message);
            if (!tx) resolve({ result: 'not found' });
            else if (!tx.blockNumber) resolve({ result: 'pending' });
            else {
                let result = { result: 'mined' };
                web3.eth.getTransactionReceipt(hash, (err, receipt) => {
                    if (err) reject(err.message);
                    if (!receipt) resolve({ result: 'receipt not ready' });
                    else {
                        result.receipt = receipt;
                        result.receipt.nonce = tx.nonce;
                        result.feePaid = receipt.gasUsed * tx.gasPrice
                        resolve(result);
                    }
                });
            }
        });
    });
    if (callback) {
        if (typeof callback !== 'function') throw new Error('callback is not a function');
        promise.then(res => callback(null, res), rej => callback(rej));
    } else return promise;
}

/**
 * Transaction object
 */
class Transaction {

    txData = {
        id: Date.now(),
        to: null,
        amount: 0,
        msgData: '0x',
        gasPrice: startGasPrice,
        gasEstimate: null,
        nonce: 'latest',
        privateKey: null,
        senderAddress: null,
        chain: defaultChain,
        boostInterval: boostInterval,
        retryFailedTx: retryFailedTx
    }

    hash = [];
    errors = [];
    boostTimeout = null;

    /**
    * Create new transaction
    * @param {Object} param Transaction params object
    * @param {string} param.id optional ID of transaction for tracing
    * @param {string} param.to tx destination 
    * @param {*} param.amount transfer amount, full/all can be accepted
    * @param {string} param.msgData default 0x (empty value)
    * @param {*} param.gasPrice if null using startGasPrice, "auto" for RPC value 
    * @param {Number} param.gasEstimate
    * @param {*} param.nonce pending, latest can be accepted
    * @param {string} param.privateKey 0x...
    * @param {string} param.senderAddress 0x... Be careful inside there is no check for correspondence of the private key to the account!!!
    * @param {string} param.chain  (ropsten/mainnet or chain short name from https://chainid.network/) If not set, takes the default.
    * @param {Number} param.boostInterval boost interval in seconds, default 0 (auto forcing disabled)
    * @param {Account} param.account account object in proprietary format (https://www.npmjs.com/package/eth_account)
    * @param {Boolean} param.retryFailedTx resend transaction refused by RPC, default false.
    */
    constructor(param) {

        if (!param) throw new Error('no param passed');

        checkWeb3Initialization();

        if (param.account) {
            param.senderAddress = param.account.address;
            param.privateKey = param.account.PK;
        }

        this.txData = Object.assign(this.txData, param);

        //Preparing tx
        if (this.txData.to && !web3.utils.isAddress(this.txData.to)) throw new Error("incorrect 'to:' address: " + this.txData.to);
        if (!this.txData.privateKey || this.txData.privateKey.length != 66) throw new Error("incorrect private key: " + this.txData.privateKey);
        if (!this.txData.senderAddress) this.txData.senderAddress = web3.eth.accounts.privateKeyToAccount(this.txData.privateKey).address;
        if (this.txData.gasEstimate && typeof this.txData.gasEstimate !== 'number') throw new Error('gas estimate is not a number');
        if (this.txData.gasEstimate && (this.txData.gasEstimate != "auto" && typeof this.txData.gasEstimate !== 'number')) throw new Error('gas estimate is not a number');
        if (this.txData.nonce != 'latest' && (this.txData.amount == 'full' || this.txData.amount == 'all')) throw new Error('Unable to send full balance with a "pending" nonce, only "latest" can be accepted');
    }

    /**
     * Blocks concurrent execution of code inside asynchronous functions by waiting for lockControl initialization, 
     * returns a function via a promise that needs to be called to empty the queue
     * usage:
     * let lock = await this.lockControl();
     * lock.unlock();
     * @param {Boolean} onlyWait do not block the thread, default false
     */
    lockControl = function (onlyWait = false) {
        if (typeof this.queue === 'undefined') this.queue = [];
        let myQueue = this.queue.length;
        if (!onlyWait) this.queue.push(true);

        return new Promise(resolve => {
            let lockCheck = () => {
                for (let i = 0; i < (onlyWait ? this.queue.length : myQueue); i++) {
                    if (this.queue[i]) {
                        setTimeout(() => {
                            lockCheck();
                        }, 100);
                        return;
                    };
                }
                resolve({ unlock: () => { this.queue[myQueue] = false } });
            }
            lockCheck();
        });
    };


    /**
     * Send transaction to network
     */
    send = async function () {

        let lock = await this.lockControl();
        if (!Number.isInteger(this.txData.gasPrice) || this.txData.gasPrice == 'auto') await web3.eth.getGasPrice().then(res => { this.txData.gasPrice = (res - -1); });
        if (this.txData.nonce == 'latest') await web3.eth.getTransactionCount(this.txData.senderAddress, 'latest').then(txQty => { this.txData.nonce = txQty; });
        else if (this.txData.nonce == 'pending') await web3.eth.getTransactionCount(this.txData.senderAddress, 'pending').then(txQty => { this.txData.nonce = txQty; });
        //if (!this.txData.chain) await web3.eth.net.getNetworkType().then(name => { if (name != 'main') this.txData.chain = name; });
        //Gas calc
        if (this.txData.amount != 'all' && this.txData.amount != 'full' && !web3.utils.isBigNumber(this.txData.amount)) this.txData.amount = web3.utils.toBN(this.txData.amount); //before gas calc
        if (!this.txData.gasEstimate) {
            let gasCalcOk = await web3.eth.estimateGas({
                from: this.txData.senderAddress,
                to: this.txData.to,
                value: (this.txData.amount == 'all' || this.txData.amount == 'full') ? 0 : this.txData.amount,
                gasPrice: this.txData.gasPrice,
                data: this.txData.msgData
            }).then(
                res => { this.txData.gasEstimate = res; },
                err => { console.error('calc gas error:\n' + err + '\ntry to calc without gasPrice...'); }
            );

            if (!gasCalcOk) {
                await web3.eth.estimateGas({
                    from: this.txData.senderAddress,
                    to: this.txData.to,
                    value: (this.txData.amount == 'all' || this.txData.amount == 'full') ? 0 : this.txData.amount,
                    data: this.txData.msgData
                }).then(
                    res => { this.txData.gasEstimate = res; },
                    err => { throw new Error("error in gas calc: " + err); }
                );
            }
        }
        if (this.txData.amount == 'all' || this.txData.amount == 'full') await web3.eth.getBalance(this.txData.senderAddress, 'latest').then(bal => { this.txData.amount = (web3.utils.toBN(bal).sub(web3.utils.toBN(this.txData.gasPrice).mul(web3.utils.toBN(this.txData.gasEstimate)))) });



        let rawTx = {
            nonce: this.txData.nonce,
            to: this.txData.to,
            data: this.txData.msgData,
            value: this.txData.amount,
            gasPrice: this.txData.gasPrice,
            gasLimit: this.txData.gasEstimate
        }

        console.log('sending tx id:' + this.txData.id, rawTx, 'amount:', web3.utils.fromWei(rawTx.value));

        //chain
        let chainID = 0;
        let cahinName = this.txData.chain ?? defaultChain;
        switch (cahinName) {
            case 'mainnet': chainID = 1; break;
            case 'goerli': chainID = 5; break;
            default:
                chains.forEach(element => {
                    if (element.shortName == this.txData.chain) {
                        chainID = element.chainId;
                        //network = element.network;
                    }
                });
                if (chainID == 0) {
                    if (Number.isInteger(cahinName)) chainID = cahinName;
                    else throw new Error('chain not found');
                }
                break;
        }

        var common = Common.forCustomChain('mainnet', { chainId: chainID });
        let tx = new Tx(rawTx, { common });

        let _privateKey = Buffer.from(this.txData.privateKey.slice(2), 'hex');
        tx.sign(_privateKey);
        let serializedTx = tx.serialize();

        // If the transaction has not been mined within 750 seconds (default timeout), an error is returned: 
        // Transaction was not mined within 750 seconds, please make sure your transaction was properly sent. Be aware that it might still be mined!
        let sendTonode = () => {
            let txHash = web3.utils.sha3('0x' + serializedTx.toString('hex')); // tx hash calculation in advance
            console.log('sending to RPC => id:', this.txData.id, ' hash:', txHash);
            web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                .on('error', error => {
                    this.errors.push(error);
                    console.error('tx id:', this.txData.id, error.message ?? error, '| sender:', this.txData.senderAddress, 'nonce:', this.txData.nonce);
                    if (this.txData.retryFailedTx) setTimeout(sendTonode, 10000); //lock control protect from boosting during retry
                    else {
                        if (calcHashAnyway) this.hash.push(txHash);
                        lock.unlock();
                    }
                })
                .once('transactionHash', hash => {
                    this.hash.push(hash);
                    lock.unlock();
                })
                .once('receipt', receipt => {
                    console.log('tx id:', this.txData.id, 'sending done');
                    if (!this.hash.includes(receipt.transactionHash)) this.hash.push(receipt.transactionHash);
                    if (this.boostTimeout) clearTimeout(boostTimeout);
                    lock.unlock();
                });//.catch((error) => console.error('tx id catched error:', this.txData.id, error.message ?? error, '| sender:', this.txData.senderAddress, 'nonce:', this.txData.nonce));
            //.on('confirmation', (confNum, rec) => { console.log('receipt tx', rec.transactionHash, " num of confirmations", confNum) })
        }
        sendTonode();
    }

    /**
     * check transaction execution
     * @returns {Object} {result,receipt} result can be "not found", "pending", "mined" 
     */
    check = async function () {
        if (typeof this.checkPromise !== 'undefined' && this.checkPromise) return new Promise((res, rej) => { this.checkPromise.then(res, rej); });
        else this.checkPromise = new Promise(async (resolve, reject) => {
            if (this.hash.length == 0) {
                reject('no hash');
                this.checkPromise = null;
                return;
            }
            console.log('checking tx id:', this.txData.id);
            for (let i = (this.hash.length - 1); i >= 0; i--) {
                try {
                    let res = await checkTxHash(this.hash[i]);
                    if (res) {
                        console.log(i, this.hash[i], res.result);
                        if (res.result == 'mined') {
                            resolve(res);
                            this.checkPromise = null;
                            return;
                        } else if (res.result == 'pending') {
                            break; // reduce RPC calls
                        }
                    }
                } catch (error) {
                    return reject(error);
                }
            }
            resolve(false);
            this.checkPromise = null;
        });
        return this.checkPromise;
    }

    /**
     * cancel transaction (re-resend to yourself with a higher gas price)
     */
    cancel = async function () {
        let lock = await this.lockControl();

        var mined = await this.check();
        if (mined || !this.hash.length) return;
        this.txData.to = this.txData.senderAddress;
        this.txData.amount = 0;
        this.txData.msgData = '0x';
        this.txData.gasEstimate = 21000;
        this.txData.gasPrice += Math.floor(this.txData.gasPrice / 100 * gasPriceStep);
        this.send();
        console.log('tx', this.txData.id, 'canceled', 'hash', this.hash);

        lock.unlock();
    }

    /**
     * replace with the same transaction with a higher gas price
     * @returns {Promise} 'boosted' or 'mined depending on the result
     */
    boost = async function () {
        return new Promise(async (resolve, reject) => {
            //if (!this.hash.length) return reject('tx not yet created');
            let lock = await this.lockControl();  // for not concurrent boosting
            let mined = await this.check().catch(e => console.error('boost error', e));
            if (mined) return resolve('mined');

            let nonce = await web3.eth.getTransactionCount(this.txData.senderAddress, 'latest');
            if (nonce > this.txData.nonce) reject('tx nonce is incorrect is lower than the current nonce');
            else if (nonce == this.txData.nonce) {
                console.log('boost tx id:', this.txData.id, 'hash:', this.hash[this.hash.length - 1] ?? 'not yet created');
                this.txData.gasPrice += Math.floor(this.txData.gasPrice / 100 * gasPriceStep);
                // check if balance is sufficent
                let bal = await web3.eth.getBalance(this.txData.senderAddress, 'latest');
                let fullAmount = this.txData.amount.add(web3.utils.toBN(this.txData.gasPrice).mul(web3.utils.toBN(this.txData.gasEstimate)));
                if (fullAmount.gt(web3.utils.toBN(bal))) {
                    //toDo optional
                    console.log('ATTENTION the transaction amount will be reduced!!!');
                    this.txData.amount = (web3.utils.toBN(bal).sub(web3.utils.toBN(this.txData.gasPrice).mul(web3.utils.toBN(this.txData.gasEstimate))));
                }
                this.send();
            }
            resolve('boosted');

            lock.unlock();
        });
    }

    /**
     * start boosting TX (replace with the same transaction with a higher gas price)
     * is simple recall boost() method until transaction will be mined
     * @param {*} interval boost interval in seconds, default 0 (auto forcing disabled)
     */
    boosting = async (interval = 0) => {
        if (interval) this.txData.boostInterval = interval;
        if (this.txData.boostInterval > 0) {
            this.boostTimeout = setTimeout(async () => {
                let boostRes;
                try {
                    boostRes = await this.boost();
                } catch (error) {
                    console.error(this?.txData?.id, 'boosting error:', error);
                }
                if (boostRes != 'mined') this.boosting();
            }, this.txData.boostInterval * 1000);
        }
    }

    /**
     * track the status of a transaction
     * @param {Number} interval check interval in seconds
     * @returns {Promise} waits until tx will be mined and returns the transaction result or promise reject in case of incident
     */
    wait = async function (interval = 15) {
        return new Promise((resolve, reject) => {
            let checkState = async () => {
                setTimeout(() => {
                    this.check().then(
                        res => {
                            if (!res) checkState();
                            else resolve(res);
                        },
                        rej => {
                            console.log('tx id:', this.txData.id, 'monit error:', rej);
                            //reject(rej);
                            checkState();
                        });
                }, interval * 1000);
            }
            checkState();
        });
    }

    /**
    * track the status of a transaction
    * @param {Number} interval check interval in seconds
    * @returns {Promise} waits until tx will be mined and returns the transaction result or promise reject in case of incident
    */
    waitFirstHash = async function (interval = 15) {
        return new Promise((resolve, reject) => {
            let checkHash = async () => {
                setTimeout(() => {
                    if (this.hash.length) resolve(this.hash[0]);
                    else if (this.errors.length) reject(this.errors[0]);
                    else checkHash();
                }, interval * 1000);
            }
            checkHash();
        });
    }

    sendERC20 = async (token, to, amount) => {
        let lock = await this.lockControl();

        if (amount == 'all' || amount == 'full') await web3.eth.call({ to: token, data: "0x70a08231" + "000000000000000000000000" + this.txData.senderAddress.slice(2) }).then(res => { amount = res; });
        else amount = web3.utils.padLeft(web3.utils.toHex(amount), 64);

        this.txData.to = token;
        this.txData.msgData = "0xa9059cbb" + "000000000000000000000000" + to.slice(2) + amount.slice(2);
        this.txData.amount = 0;
        console.log(token, 'ERC20 transfer, from 0x' + this.txData.senderAddress, 'to:', to, 'amount:', web3.utils.fromWei(amount));
        this.send();
        lock.unlock();
        if (this.txData.boostInterval > 0) this.boosting();
    }
}


module.exports = {
    Transaction: Transaction,
    init: init,
    web3: () => { return web3; },
    sendTx: sendTx,
    sendTxAsync: sendTxAsync,
    sendERC20: sendERC20,
    checkHash: checkTxHash,
};
