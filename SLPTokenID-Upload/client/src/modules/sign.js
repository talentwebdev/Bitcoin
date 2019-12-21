export function signMessage(message, key)
{
    //var Message = require('bitcore-message');
    var bitcore = require("bitcore-lib");

    var privateKey = new bitcore.PrivateKey(key);
    var message = new bitcore.Message(message);

    var signature = message.sign(privateKey);
    return signature
}