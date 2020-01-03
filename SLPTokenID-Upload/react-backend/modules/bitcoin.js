const axios = require("axios");
const btoa = require("btoa");

function signMessage(message, privateKey)
{
    var bitcore1 = require("bitcore-lib");

    var privateKey = bitcore1.PrivateKey(privateKey);
    var message = bitcore1.Message(message);

    var signature = message.sign(privateKey);
    return signature;
}

function verifyMessage(message, signature, address)
{
 
    //var Message = bitcore.Message;
    var Message = require('bitcore-message');
    console.log(Message);

    var verified = Message(message).verify(address, signature);
    return verified;
}

function getCashAddressFromSLPAddress(address)
{
    const slpjs = require("slpjs");
    let cashaddr = slpjs.Utils.toCashAddress(address);

    return cashaddr;
}

function getLegacyFromSLPAddress(address)
{
    const slpjs = require("slpjs");
    let legacy = slpjs.Utils.toLegacyAddress(address);
    return legacy;
}


function getSLPAddressFromTokenID(tokenid)
{
    const query = {
        "v": 3,
        "q": {
            "db": ["g"],
            "find": {
                "tokenDetails.tokenIdHex": tokenid
            }
        }
    };
    return new Promise((resolve, reject) => {
        axios.get(getSLPDBUrlFromQuery(query))
            .then(function(response){
                const BreakException = {};
                try{
                    response.data.g.forEach(element => {
                    
                        const graphTxn = element.graphTxn;
                        if(graphTxn.txid == tokenid)
                        {
                            const inputs = graphTxn.inputs;
                            const outputs = graphTxn.outputs;
                            if(outputs.length != 0)
                                resolve(outputs[0].address);
                            else if(inputs.length != 0)
                                resolve(inputs[0].address);
                        }
                    });

                    reject({message: "no available address"});
                }catch(e)
                {
                    if(e !== BreakException) {
                        reject(e);
                        return ;
                    }                    
                }
                
            })
            .catch(function(error){
                console.log("getSLPAddress failed", error);
                reject(error);
            })
            .finally(function(){

            });
        });
}


function getSLPDBUrlFromQuery(query)
{
  var query_sz = JSON.stringify(query);

  var v64 = btoa(query_sz);
  return "https://slpdb.bitcoin.com/q/" + v64;
}

module.exports = {
    signMessage: signMessage,
    verifyMessage: verifyMessage,
    getCashAddressFromSLPAddress: getCashAddressFromSLPAddress, 
    getLegacyFromSLPAddress: getLegacyFromSLPAddress,
    getSLPAddressFromTokenID: getSLPAddressFromTokenID,
    getSLPDBUrlFromQuery: getSLPDBUrlFromQuery
}