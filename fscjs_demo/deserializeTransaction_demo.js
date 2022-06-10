const { Api, JsonRpc } = require('fscjs')
const { JsSignatureProvider } = require('fscjs/dist/fscjs-jssig')
const fetch = require('node-fetch')

const rpcUrl = 'http://127.0.0.1:8888';
const defaultPriKey = '';

(async () => {
        const rpc = new JsonRpc(rpcUrl, { fetch });
        const signatureProvider = new JsSignatureProvider([defaultPriKey])
        const requiredKeys = await signatureProvider.getAvailableKeys()
        let chainInfo = await rpc.get_info()
        const api = new Api({rpc,signatureProvider,extDecoder: new TextDecoder(),textEncoder: new TextEncoder()})

        const actions = [
            {
                account: 'fscio.token',
                name: 'transfer',
                authorization: [
                    {
                        actor: 'useraaaaaaaa',
                        permission: 'active',
                    },
                ],
                data: {
                    from: 'useraaaaaaaa',
                    to: 'userbbbbbbbb',
                    quantity: '1.00000000 SYS', //金额
                    memo :"test"
                },
            },
        ]

        const customConfig = { broadcast: false, blocksBehind: 3, expireSeconds: 30, sign: false}
        const transactResult = await api.transact({ actions}, customConfig);
        const signatureProviderResult = await api.signatureProvider.sign({
            chainId: chainInfo.chain_id,
            requiredKeys,
            serializedTransaction: transactResult.serializedTransaction,
        })
        
        const transaction = api.deserializeTransaction(signatureProviderResult.serializedTransaction)
        console.log(JSON.stringify(transaction))
}
)();

