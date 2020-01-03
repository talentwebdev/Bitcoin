export function signMessage(message, key)
{
    //var Message = require('bitcore-message');
    var bitcore = require("bitcore-lib");

    var privateKey = new bitcore.PrivateKey(key);
    var message_obj = new bitcore.Message(message);

    var signature = message_obj.sign(privateKey);
    return signature
}