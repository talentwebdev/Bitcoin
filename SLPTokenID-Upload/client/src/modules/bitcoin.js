
import {Utils} from "slpjs"

const axios = require("axios");

export function signMessage(message, privateKey)
{
    var bitcore1 = require("bitcore-lib");

    var private_key = bitcore1.PrivateKey(privateKey);
    var message_obj = bitcore1.Message(message);

    var signature = message_obj.sign(private_key);
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
                        if(graphTxn.txid === tokenid)
                        {
                            const inputs = graphTxn.inputs;
                            const outputs = graphTxn.outputs;
                            if(outputs.length !== 0)
                                callback(outputs[0].address);
                            else if(inputs.length !== 0)
                                callback(inputs[0].address);   
                            throw BreakException;        
                        }
                    });

                    callback(null);
                }catch(e)
                {
                    if(e !== BreakException) {
                        callback(null);
                        return ;
                    }
                    else return;
                }
                
            })
            .catch(function(error){
                console.log("getSLPAddress failed", error);
                callback(null);
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