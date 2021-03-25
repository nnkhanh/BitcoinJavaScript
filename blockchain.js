const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const SHA256 = require('crypto-js/sha256');

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){

        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw Error('you cannot sign transaction with other wallet');            
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        if(this.fromAddress === null){
            return true;
        }

        if(!this.signature || this.signature.length === 0){
            throw new Error('no signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        console.log('publickey get: ' + publicKey);
        const isValid = publicKey.verify(this.calculateHash(), this.signature);
        return isValid;
    }
}

class Block{
    constructor(timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash(){
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }
   
    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            //console.log("nonce = " + this.nonce);
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined..." + this.hash);
    }

    hasValidTransactions(){
         for(const tx of this.transactions){
             if(!tx.isValid()){
                 return false;
             }
         }
         return true;
    }
}

class BlockChain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTractions = [];
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block(Date.parse('2021-01-01'), [], "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length -1];
    }

    minePendingTransactions(miningRewardAddress){
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTractions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTractions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log("Block mined...");

        this.chain.push(block);

        this.pendingTractions = [];
    }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must fill in to.from address');
        }

        if(!transaction.isValid()){
            throw new Error('cannot add invalid transaction');
        }

        this.pendingTractions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance = 0;
        for(const block of this.chain){
            for(const transaction of block.transactions){
                if(transaction.fromAddress == address){
                    balance -= transaction.amount;
                }

                if(transaction.toAddress == address){
                    balance += transaction.amount;
                }
            }
        }   
        
        return balance;
    }

    isChainValid(){
        for(const i = 0; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.calculateHash()){
                return false;
            }
        }
        return true;
    }
        
}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;