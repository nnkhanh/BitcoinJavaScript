const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const mykey = ec.keyFromPrivate('2ab8beda3db6eb68ba3ccd7b0491079d9d662de37289a27be3696e9bf0949e58');
const myWalletAddress = mykey.getPublic('hex');

const {BlockChain, Transaction} = require('./blockchain');

let savicCoin = new BlockChain();

const tx1 = new Transaction(myWalletAddress, 'public key go here', 10);
tx1.signTransaction(mykey);
savicCoin.addTransaction(tx1);

console.log("Start mining...\n");
savicCoin.minePendingTransactions(myWalletAddress);

console.log("balance of savic-address = " + savicCoin.getBalanceOfAddress(myWalletAddress));
