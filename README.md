# Hyperledger Sawtooth batches with Metamask keys

Run
### `npm start`


`./src/App.js` show how to generate the batchListBytes that ca be send to Sawtooth to submit transaction.

## Considerations

Metamask can sign data, but because it usually is used with Ethereum most libraries use signatures that are used in Ethereum. That is they wrap the data (https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html#sign), they then hash it using keccak256, and that hash is finnaly signed with secp256k1.

An example where no wraping or intermediaries are used is in:
https://github.com/danfinlay/js-eth-personal-sign-examples/blob/master/index.js

However, this type of signing is considered a "dangerous phishing risk" https://docs.metamask.io/guide/signing-data.html.


Another detail is that Metamask and Sawtooth signatures are slighlt different. Metamask adds a "0x" at the begginign of signatures and they use "v", "r" and "s" to represent those signatures, Sawtooth only uses "r" and "s". In practice these means Sawtooth ignores the last two characters of a Metamask signature.

## References

https://sawtooth.hyperledger.org/docs/core/releases/1.2.6/_autogen/sdk_submit_tutorial_js.html

https://github.com/ethereum/web3.js/blob/0.20.7/DOCUMENTATION.md

https://stackoverflow.com/questions/33914764/how-to-read-a-binary-file-with-filereader-in-order-to-hash-it-with-sha-256-in-cr

