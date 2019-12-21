module.exports = function verifyMessage(message, signature, address)
{
 
    //var Message = bitcore.Message;
    var Message = require('bitcore-message');
    console.log(Message);

    var verified = Message(message).verify(address, signature);
    return verified;
}
