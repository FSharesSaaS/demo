## fscjs接口文档[v1.1.4]

[TOC]



### Api

#### Api()

**Api构造函数**

创建一个Api实例对象

**函数原型**

```javascript
new Api(args: object): Api
```

**参数**

args：json对象，成员如下：

- rpc: JsonRpc对象
- authorityProvider: 授权提供器，未指定时使用rpc
- abiProvider: Abi提供器，未指定时使用rpc
- signatureProvider: 签名提供器
- chainId: 链ID
- textEncoder: TextEncoder对象，在浏览器中使用时传入null
- textDecoder: TextDecoder对象，在浏览器中使用时传入null

**返回值**

返回Api实例。

**示例代码**

```javascript
import {Api,JsonRpc,JsSignatureProvider} from 'fscjs'
import { TextDecoder, TextEncoder } from 'text-encoding'

const rpc = new JsonRpc('http://127.0.0.1:8888');
const signatureProvider = new JsSignatureProvider(['....']);
const api = new Api({rpc,signatureProvider,textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })
```

#### api.transact()

Api类的`transact()`方法创建并（可选地）广播一个交易对象。

**函数原型**

```javascript
transact(transaction: any, namedParameters?: object): Promise<any>
```

**参数**

- transaction：交易原始数据
- namedParameters：方法调用选项，可选对象，其成员如下：
  - broadcast：是否广播交易，布尔型，默认值：true
  - blocksBehind：滞后块数，整数
  - expireSeconds：超时秒数，整数
  - sign：是否签名，布尔类型，默认值：true

**返回值**

`transact()`方法的返回值是一个Promise对象，当设置broadcast选项时，该 Promise对象解析为来自RPC调用的响应，否则解析为`{signatures, serializedTransaction}`。

**示例代码**

```javascript
(async () => {
  const result = await api.transact({
    actions: [{
      account: 'tommy',
      name: 'hi',
      authorization: [{
        actor: 'tommy',
        permission: 'active',
      }],
      data: {
        user: 'tommy'
      },
    }]
  }, {
    broadcast:false,
    blocksBehind: 3,
    expireSeconds: 30,
  });
  console.dir(result);
})();
```

#### api.deserializeTransaction()

deserializeTransaction()方法将序列化后的二进制字节数组转换成交易，将操作保留为十六进制

**函数原型**

```javascript
deserializeTransaction(transaction: Uint8Array): any
```

**参数**

transaction：序列化的交易【字节数组】

**返回值**

交易

**示例代码**

```javascript
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


```



#### api.pushSignedTransaction()

`pushSignedTransaction()`方法将一个已经签名的交易广播到网络中。

**函数原型**

```javascript
pushSignedTransaction(namedParameters: object): Promise<any>
```

**参数**

namedParameters：参数对象，成员如下：

- serializedTransaction：序列化的交易，Uint8Array
- signatures：交易签名数组，string[]

**返回值**

`pushSignedTransaction()`方法返回一个Promise对象，其解析值为RPC 调用的响应结果。

**示例代码**

```javascript
(async()=>{
  let params = {
    serializedTransaction: [...],
    signatures: ['...']
  }
  let ret = await api.pushSignedTransaction(params)
  console.log(ret)
})()
```

### JsonRpc

#### JsonRpc()

**JsonRpc构造函数**

创建一个JsonRpc实例对象。

**函数原型**

```javascript
new JsonRpc(endpoint: string, args?: object): JsonRpc
```

**参数**

- endpoint: 字符串，节点RPC API的访问端结点
- args：选项参数，可选，成员如下：
  - fetch：fetch对象，在浏览器中值为null，在node中提供一个fetch api实现实例

**返回值**

返回一个JsonRpc实例

**示例代码**

```javascript
import {JsonRpc} from 'fscjs'

const rpc = new JsonRpc('http://127.0.0.1:8888');
```

#### jsonRpc.get_abi()

`get_abi()`方法是对RPC接口`/v1/chain/get_abi`的封装。

**函数原型**

```javascript
get_abi(account_name: string): Promise<GetAbiResult>
```

**参数**

account_name：合约的托管账号，string

**返回值**

`get_abi()`方法返回一个Promise对象，其解析值为RPC响应结果对象， 成员如下：

- account_name：合约托管账号，string
- abi：Abi对象，成员如下：
  - version：ABI版本，string
  - types：ABI类型别名定义，数组
  - structs：ABI结构定义，数组
  - actions：ABI动作定义，数组
  - tables：ABI数据表定义，数组
  - abi_extensions：ABI扩展定义，数组
  - variants：ABI变量定义，数组
  - ricardian_clauses：合约的李嘉图语句，数组

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_abi('fscio')
  console.log(ret.abi)
})()
```

#### jsonRpc.get_account()

`get_account()`方法是对RPC接口`/v1/chain/get_account`的封装。

**函数原型**

```javascript
get_account(account_name: string): Promise<any>
```

**参数**

account_name：合约的托管账号，string

**返回值**

`get_account()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_account('fscio')
  console.log(ret.abi)
})()
```

#### jsonRpc.get_block()

`get_block()`方法是对RPC接口`/v1/chain/get_block`的封装。

**函数原型**

```javascript
get_block(block_num_or_id: number | string): Promise<GetBlockResult>
```

**参数**

block_num_or_id：区块编号或id，number或string类型

**返回值**

`get_block()`方法返回一个Promise对象，其解析值为RPC响应结果对象， 成员如下：

- action_mroot
- block_num
- confirmed
- id
- previous
- producer
- producer_signature
- ref_block_prefix
- schedule_version
- timestamp
- transaction_mroot

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_block(1)
  console.log(ret.id)
})()
```

#### jsonRpc.get_block_header_state()

`get_block_header_state()`方法是对RPC接口`/v1/chain/get_block_header_state`的封装

**函数原型**

```javascript
get_block_header_state(block_num_or_id: number | string): Promise<any>
```

**参数**

block_num_or_id：区块编号或id，number或string类型

**返回值**

`get_block_header_state()`方法返回一个Promise对象，其解析值为RPC响应结果对象

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_block_header_state(1)
  console.log(ret)
})()
```

#### jsonRpc.get_code()

`get_code()`方法是对RPC接口`/v1/chain/get_code`的封装。

**函数原型**

```javascript
get_code(account_name: string): Promise<GetCodeResult>
```

**参数**

account_name：合约托管账号，string

**返回值**

`get_code()`方法返回一个Promise对象，其解析值为RPC响应结果对象， 成员如下：

- account_name：账号名称，string
- abi：Abi对象，成员如下：
  - version：ABI版本，string
  - types：ABI类型别名定义，数组
  - structs：ABI结构定义，数组
  - actions：ABI动作定义，数组
  - tables：ABI数据表定义，数组
  - abi_extensions：ABI扩展定义，数组
  - variants：ABI变量定义，数组
  - ricardian_clauses：合约的李嘉图语句，数组
- code_hash：代码的哈希值，string
- wasm：wasm格式的代码，string
- wast：wast格式的代码，string

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_code('fscio')
  console.log(ret.code_hash)
})()
```

#### jsonRpc.get_currency_balance()

`get_currency_balance()`方法返回指定账号的代币余额信息，它是对RPC接口 `/v1/chain/get_currency_balance`的封装。

**函数原型**

```javascript
get_currency_balance(code: string, account: string, symbol?: string): Promise<any>
```

**参数**

- code：合约托管代码
- account：要查询余额的持币账户
- symbol：代币符号，可选

**返回值**

`get_currency_balance()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_currency_balance('fscio.token','fscio','SYS')
  console.log(ret)
})()
```

#### jsonRpc.get_currency_stats()

`get_currency_stats()`方法返回代币的总体发行信息，它是对RPC接口 `/v1/chain/get_currency_stats`的封装。

**函数原型**

```javascript
get_currency_stats(code: string, symbol: string): Promise<any>
```

**参数**

- code：合约托管代码
- symbol：代币符号

**返回值**

`get_currency_stats()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_currency_stats('fscio.token','SYS')
  console.log(ret)
})()
```

#### jsonRpc.get_info()

`get_info()`方法返回当前所接入FSC链的总体信息，它是对RPC接口 `/v1/chain/get_info`的封装。

**函数原型**

```javascript
get_info(): Promise<GetInfoResult>
```

**参数**

无

**返回值**

get_info()方法返回一个Promise对象，其解析值为RPC响应结果对象， 成员如下：

- block_cpu_limit
- block_net_limit
- chain_id：链ID
- head_block_id：链头区块ID
- head_block_num：链头区块序号
- head_block_producer
- head_block_time
- last_irreversible_block_id
- last_irreversible_block_num
- server_version：节点版本
- virtual_block_cpu_limit
- virtual_block_net_limit

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_info()
  console.log(ret.head_block_num)
})()
```

#### jsonRpc.get_producer_schedule()

`get_producer_schedule()`方法返回出块调度信息，它是对RPC接口 `/v1/chain/get_producer_schedule`的封装。

**函数原型**

```javascript
get_producer_schedule(): Promise<any>
```

**参数**

无

**返回值**

`get_producer_schedule()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_producer_schedule()
  console.log(ret)
})()
```

#### jsonRpc.get_producers()

`get_producers()`方法返回当前出块人信息，它是对RPC接口 `/v1/chain/get_producers`的封装。

**函数原型**

```javascript
get_producers(json?: boolean, lower_bound?: string, limit?: number): Promise<any>
```

**参数**

- json：是否返回json对象，默认值：true
- lower_bound：下界，默认值：""
- limit：最多返回数量，默认值：50

**返回值**

`get_producers()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_producers()
  console.log(ret)
})()
```

#### jsonRpc.get_raw_code_and_abi()

`get_raw_code_and_abi()`方法返回指定账号上托管合约的代码和ABI，它是对RPC接口 `/v1/chain/get_raw_code_and_abi`的封装。

**函数原型**

```javascript
get_raw_code_and_abi(account_name: string): Promise<GetRawCodeAndAbiResult>
```

**参数**

account_name：合约的托管账号，string

**返回值**

`get_raw_code_and_abi()`方法返回一个Promise对象，其解析值为RPC响应结果对象， 成员如下：

- account_name：合约托管账号，string
- abi：合约的ABI定义对象，成员如下：
  - version：ABI版本，string
  - types：ABI类型别名定义，数组
  - structs：ABI结构定义，数组
  - actions：ABI动作定义，数组
  - tables：ABI数据表定义，数组
  - abi_extensions：ABI扩展定义，数组
  - variants：ABI变量定义，数组
  - ricardian_clauses：合约的李嘉图语句，数组
- wasm：wasm格式的合约代码 ，string

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_raw_code_and_abi('fscio')
  console.log(ret.wasm)
})()
```

#### jsonRpc.get_table_rows()

`get_table_rows()`方法返回指定数据表的查询结果，它是对RPC接口 `/v1/chain/get_table_rows`的封装。

**函数原型**

```javascript
get_table_rows(namedParameters: object): Promise<any>
```

**参数**

namedParameters：参数对象，其成员如下：

- code
- scope
- table
- json
- limit
- lower_bound
- upper_bound
- index_position
- table_key
- key_type

**返回值**

`get_table_rows()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.get_table_rows({
    code:'fscio.token',
    table:'stats',
    scope:'SYS'
  })
  console.log(ret)
})()
```

#### jsonRpc.history_get_actions()

`history_get_actions()`方法返回指定数据表的查询结果，它是对RPC接口 `/v1/history/get_actions`的封装。

**函数原型**

```javascript
history_get_actions(account_name: string, pos?: number, offset?: number): Promise<any>
```

**参数**

- account_name：账号名称
- pos：起始位置，可选
- offset：偏移量，可选

**返回值**

`history_get_actions()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.history_get_actions('fscio')
  console.log(ret)
})()
```

#### jsonRpc.history_get_controlled_accounts()

`history_get_controlled_accounts()`方法返回指定账号的受控子账号，它是对RPC接口 `/v1/history/get_controlled_accounts`的封装。

**函数原型**

```javascript
history_get_controlled_accounts(controlling_account: string): Promise<any>
```

**参数**

- controlling_account：主控账号名称

**返回值**

`history_get_controlled_accounts()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.history_get_controlled_accounts('fscio')
  console.log(ret)
})()
```

#### jsonRpc.history_get_key_accounts()

`history_get_key_accounts()`方法返回指定公钥关联的账号，它是对RPC接口 `/v1/history/get_key_accounts`的封装。

**函数原型**

```javascript
history_get_key_accounts(public_key: string): Promise<any>
```

**参数**

- public_key：要查询的公钥

**返回值**

`history_get_key_accounts()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.history_get_key_accounts('FSC8ACNVuxt2Esb86M1qDJ4Umeh6tH8Vyin12GdwJsw3pj8USxqVs')
  console.log(ret)
})()
```

#### jsonRpc.history_get_transaction()

`history_get_transaction()`方法返回指定公钥关联的账号，它是对RPC接口 `/v1/history/get_transaction`的封装。

**函数原型**

```javascript
history_get_transaction(id: string, block_num_hint?: number): Promise<any>
```

**参数**

- id：交易ID
- block_num_hint：

**返回值**

`history_get_transaction()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.history_get_transasction('...')
  console.log(ret)
})()
```

#### jsonRpc.push_transaction()

`push_transaction()`方法向节点提交一个签名的序列化交易对象。

**函数原型**

```javascript
push_transaction(namedParameters: object): Promise<any>
```

**参数**

namedParameters：参数对象，成员如下：

- serializedTransaction：序列化之后的交易对象，字节数组
- signatures：交易的签名数组

**返回值**

`push_transaction()`方法返回一个Promise对象，其解析值为RPC响应结果对象。

**示例代码**

```javascript
(async ()=>{
  let ret = await rpc.push_transaction({
    serializedTransaction: [...],
    signatures: ['']
  })
  console.log(ret)
})()
```

### JsSignatureProvider

#### JsSignatureProvider()

**JsSignatureProvider构造函数**

创建一个JsSignatureProvider实例对象。

**函数原型**

```javascript
new JsSignatureProvider(privateKeys: string[]): JsSignatureProvider
```

**参数**

- privateKeys：私钥数组

**返回值**

返回JsSignatureProvider实例。

**示例代码**

```javascript
import {JsSignatureProvider} from 'fscjs'

const priv = '5JbrPk2h9kNtsmKTauKar5PtmE5nPhtF8BcVUSzGrZhFV7UvccK'
const signatureProvider = new JsSignatureProvider([priv]);
```

#### jsSignatureProvider.getAvailableKeys()

`getAvailableKeys()`方法返回当前签名提供器对象中的私钥对应的公钥。

**函数原型**

```javascript
getAvailableKeys(): Promise<string[]>
```

**参数**

无

**返回值**

`getAvailableKeys()`方法返回一个Promise对象，其解析值为签名提供器所 管理的私钥集合对应的公钥集合，一个字符串数组。

**示例代码**

```javascript
import {JsSignatureProvider} from 'fscjs'

const signatureProvider = new JsSignatureProvider(['...']);
console.log(signatureProvider.getAvailableKeys())
```

#### jsSignatureProvider.sign()

`sign()`方法对序列化交易进行签名。

**函数原型**

```javascript
sign(namedParameters: object): Promise<object>
```

**参数**

namedParameters：参数对象，成员如下：

- chainId：链ID，string
- requiredKeys：签名需要的公钥，string[]
- serializedTransaction：序列化之后的交易，Uint8Array

**返回值**

`sign()`方法的返回值是一个Promise对象，其解析值为签名结果。

**示例代码**

```javascript
import {JsSignatureProvider} from 'fscjs'

const signatureProvider = new JsSignatureProvider(['...'])
signatureProvider.sign({
  chainId: '...',
  requiredKeys: signatureProvider.getAvailableKeys(),
  serialzedTransaction: '....'
})
```
