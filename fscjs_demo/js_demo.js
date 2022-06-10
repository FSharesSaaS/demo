const { Api, JsonRpc } = require('fscjs')
const { JsSignatureProvider } = require('fscjs/dist/fscjs-jssig')
const fetch = require('node-fetch')
const { toNumber, toUpper } = require('lodash')
const axios = require('axios')

const rpcUrl = 'https://hka.chain.api.fshares.com';
const javaSignAccount = "rbdexmulsig1";
const contractAccount = "ibccontract1";
const baseUrl = 'https://chain-api.fshares.com';

//用户普通转载
async function transfer(token_account,fromacuName,priKey,toacuName,amount,precision,symbol){
    /*
    token_account:转账币种的合约账户
    fromacuName：转账的账户名称
    priKey：转账账户的私钥
    toacuName：转账接收币账户
    amount：转币的数量
    precision：转币的币种精度，均为8
    symbol：转币币种的名称
    */ 
    try{
        const rpc = new JsonRpc(rpcUrl, { fetch });
        const signatureProvider = new JsSignatureProvider([priKey])
        const requiredKeys = await signatureProvider.getAvailableKeys()
        let chainInfo = await rpc.get_info()
        const api = new Api({rpc,signatureProvider,extDecoder: new TextDecoder(),textEncoder: new TextEncoder()})
        
        const actions = [
            {
                account: token_account,
                name: 'transfer',
                authorization: [
                    {
                        actor: fromacuName,
                        permission: 'active',
                    },
                ],
                data: {
                    from: fromacuName,
                    to: toacuName, //
                    quantity: `${toNumber(amount).toFixed(precision)} ${toUpper(symbol)}`, //金额
                    memo:"",
                },
            },
        ]

        let timeNum = new Date().getTime().toString(16)
        if (timeNum.length % 2 !== 0) {
            timeNum += '0'
        }
        const nonceObj = {
            context_free_actions: [
                {
                    account: 'fscio.null',
                    name: 'nonce',
                    data: timeNum,
                    authorization: [],
                },
            ],
        }

        const customConfig = { broadcast: false, blocksBehind: 3, expireSeconds: 30, sign: false}
        const transactResult = await api.transact({ actions, ...nonceObj }, customConfig);  //跟transfer_test.js中普通转账的区别在于，sign参数是true还是false，默认为true
        const signatureProviderResult = await api.signatureProvider.sign({
            chainId: chainInfo.chain_id,
            requiredKeys,
            serializedTransaction: transactResult.serializedTransaction,
        })
        const transaction = api.deserializeTransaction(signatureProviderResult.serializedTransaction)  //  
        console.log(JSON.stringify(transaction))

        let params = {
            serializedTransaction: transactResult.serializedTransaction,
            signatures: signatureProviderResult.signatures
          }
          let ret = await api.pushSignedTransaction(params)
          console.log(ret)

    }catch (e) {
        console.error('Caught exception: ' + e);
    }
}

//用户提币
async function withdraw(token_account,acuName,priKey,toAddress,amount,precision,symbol){
    /*
    token_account:提币币种的合约账户
    acuName：提币的账户名称
    priKey：提币账户的私钥
    toAddress：提币外链的收款地址
    amount：提币的数量
    precision：币种的精度，均为8
    symbol：提币币种的名称
    */ 
    const url = '/api/v1/account/withdraw'
    const rpc = new JsonRpc(rpcUrl, { fetch });
    const signatureProvider = new JsSignatureProvider([priKey])
    const requiredKeys = await signatureProvider.getAvailableKeys()
    let chainInfo = await rpc.get_info()
    const api = new Api({rpc,signatureProvider,extDecoder: new TextDecoder(),textEncoder: new TextEncoder()})

    const memo = JSON.stringify({ transfer_type: 4, order_memo: '', to_address: toAddress })
    const actions = [
        {
            account: token_account,
            name: 'transfer',
            authorization: [
                {
                    actor: javaSignAccount,
                    permission: 'active',
                },
                {
                    actor: acuName,
                    permission: 'active',
                },
            ],
            data: {
                from: acuName,
                to: contractAccount,
                quantity: `${toNumber(amount).toFixed(precision)} ${toUpper(symbol)}`, //金额
                memo,
            },
        },
    ]

    let timeNum = new Date().getTime().toString(16)
    if (timeNum.length % 2 !== 0) {
        timeNum += '0'
    }
    const nonceObj = {
        context_free_actions: [
            {
                account: 'fscio.null',
                name: 'nonce',
                data: timeNum,
                authorization: [],
            },
        ],
    }

    const customConfig = { broadcast: false, blocksBehind: 3, expireSeconds: 3000, sign: false}
    const transactResult = await api.transact({ actions, ...nonceObj }, customConfig);  
    const signatureProviderResult = await api.signatureProvider.sign({
        chainId: chainInfo.chain_id,
        requiredKeys,
        serializedTransaction: transactResult.serializedTransaction,
    })

    const transaction = api.deserializeTransaction(signatureProviderResult.serializedTransaction)

    //组装java所需交易体
    const requestBody = {
        address: toAddress,
        pushTransactionRequest: {
            compression: 'none',
            transaction: transaction,
            signatures: signatureProviderResult.signatures,
        },   
    }
    console.log(JSON.stringify(requestBody))

    // 调用java接口提币接口
    try{
        const result = axios.post(`${baseUrl}${url}`,requestBody)
        return Promise.resolve(result)
    }catch (error) {
        return Promise.resolve({})
    }
}

//用户取消提币
async function cancel(acuName,priKey,transaction_id,record_id){
    /*
    acuName：取消提币的账户名称
    priKey：取消提币的账户私钥
    transaction_id：提币的transaction_id
    record_id：提币记录id
    */ 
    const url = '/api/v1/account/withdraw/cancel'
    const rpc = new JsonRpc(rpcUrl, { fetch });
    const signatureProvider = new JsSignatureProvider([priKey])
    const requiredKeys = await signatureProvider.getAvailableKeys()
    let chainInfo = await rpc.get_info()
    const api = new Api({rpc,signatureProvider,extDecoder: new TextDecoder(),textEncoder: new TextEncoder()})

    const actions = [
        {
            account: contractAccount,
            name: 'cancelextstu',
            authorization: [
                {
                    actor: contractAccount,
                    permission: 'multisig',
                },
                {
                    actor: acuName,
                    permission: 'active',
                },
            ],
            data: {
                account: acuName,
                trx_id: transaction_id
            },
        },
    ]

    let timeNum = new Date().getTime().toString(16)
    if (timeNum.length % 2 !== 0) {
        timeNum += '0'
    }
    const nonceObj = {
        context_free_actions: [
            {
                account: 'fscio.null',
                name: 'nonce',
                data: timeNum,
                authorization: [],
            },
        ],
    }

    const customConfig = { broadcast: false, blocksBehind: 3, expireSeconds: 3000, sign: false}
    const transactResult = await api.transact({ actions, ...nonceObj }, customConfig);
    const signatureProviderResult = await api.signatureProvider.sign({
        chainId: chainInfo.chain_id,
        requiredKeys,
        serializedTransaction: transactResult.serializedTransaction,
    })

    const transaction = api.deserializeTransaction(signatureProviderResult.serializedTransaction)

    //组装java接口所需交易体
    const requestBody = {
            compression: 'none',
            transaction: transaction,
            signatures: signatureProviderResult.signatures,
    }
    console.log(JSON.stringify(requestBody))
    // 调用java接口withdraw
    try{
        const result = axios.post(`${baseUrl}${url}?id=${record_id}`,requestBody)
        return Promise.resolve(result)
    }catch (error) {
        return Promise.resolve({})
    }
}

(async ()=>{
    let ret = await withdraw('1xxxxx','2xxxxxxx','3xxxxxxxxxxxxxxxxxxxxxx','4xxxxxxxxxx',1,8,"5xxxxxxx")
    console.log(ret.data)
  })()