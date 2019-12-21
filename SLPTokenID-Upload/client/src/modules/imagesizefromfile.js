
/**
 * 
 * @param {*} file File
 * @param {*} callback callback function when fetch the image size
 */
export function getImageSizeFromFile(file, callback)
{
    var fr = new FileReader;

    fr.onload = function()
    {
        var image = new Image;
        
        image.onload = function(){
            callback({ width: image.width, height: image.height});
        }

        image.src = fr.result;
    }

    fr.readAsDataURL(file);
}