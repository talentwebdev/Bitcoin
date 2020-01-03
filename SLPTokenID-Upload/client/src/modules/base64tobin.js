/**
 * Convert a base64 string in a Blob according to the data and contentType.
 * 
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 * @return Blob
 */
module.exports =  
     function b64toBin(byteCharacters, sliceSize) {
        sliceSize = sliceSize || 512;

        var byteArrays = [];

        for (var i = 0; i < byteCharacters.length; i ++) {
            byteArrays[i] = byteCharacters.charCodeAt(i);
        }

        return byteArrays;
    };