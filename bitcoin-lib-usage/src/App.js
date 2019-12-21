import React from 'react';
import DropzoneAreaExample from "./components/dropzoneareaexample";
import './App.css';

function BitCoreTest()
{
  var bitcore = require("bitcore-lib");
  //console.log(explorers);
  

  /*
  var privateKey = new bitcore.PrivateKey('L23PpjkBQqpAF4vbMHNfTZAb3KFPBSawQ7KinFTzz7dxq6TZX8UA');
  var message = bitcore.Message('This is an example of a signed message.');

  var signature = message.sign(privateKey);
  console.log(signature)
  */
}
function getBitCoinDataExplorer()
{
  const explorers = require('./../node_modules/bitcore-explorers');
  var insight = explorers.Insight();

  insight.getUtxos('1Bitcoin...', function(err, utxos) {
    if (err) {
      // Handle errors...
    } else {
      // Maybe use the UTXOs to create a transaction
    }
  });
}

function slpdbquery()
{ 
  var query = {
    "v": 3,
    "q": {
      "find": {
        "tokenDetails.tokenIdHex": "959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98",
        "token_balance": { "$gte": 0  }
      },
      "limit": 10000,
      "project": {"address": 1, "satoshis_balance": 1, "token_balance": 1, "_id": 0 }
    }
  };
  var query_sz = JSON.stringify(query);

  const btoa = require("./../node_modules/btoa");
  var v64 = btoa(query_sz);
  console.log(v64);
}

function App() {
  slpdbquery();
  return (
    <DropzoneAreaExample></DropzoneAreaExample>
  );
}

export default App;
