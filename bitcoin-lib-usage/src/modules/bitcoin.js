
import {bitcore, Utils} from "slpjs"
import {Message} from "bitcore-message"

const axios = require("axios");
const bota = require("btoa");

export function signMessage(message, privateKey)
{

    var privateKey = bitcore.PrivateKey(privateKey);
    var signature = bitcore.Message(message).sign(privateKey);

    return signature;
}

export function verifyMessage(message, signature, address)
{
 
    //var Message = bitcore.Message;
    var Message = require('bitcore-message');
    console.log(Message);

    var verified = Message('This is an example of a signed message.').verify(address, signature);
    return verified;
}

export function getCashAddressFromSLPAddress(address)
{
    let cashaddr = Utils.toCashAddress(address);

    return cashaddr;
}

export function getLegacyFromSLPAddress(address)
{
    let legacy = Utils.toLegacyAddress(address);
    return legacy;
}


export function getSLPAddressFromTokenID(tokenid, callback)
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
                                callback({ address: outputs[0].address, name: graphTxn.details.name} );
                            else if(inputs.length != 0)
                                callback({ address: inputs[0].address, name: graphTxn.details.name} );   
                            throw BreakException;        
                        }
                    });
                }catch(e)
                {
                    if(e !== BreakException) throw e;
                    else return;
                }
                
            })
            .catch(function(error){
                console.log("getSLPAddress failed", error);
            })
            .finally(function(){

            });
}


export function getSLPDBUrlFromQuery(query)
{
  var query_sz = JSON.stringify(query);

  var v64 = btoa(query_sz);
  return "https://slpdb.bitcoin.com/q/" + v64;
}