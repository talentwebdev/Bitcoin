/* RESIZE OPTIMIZE IMAGES */
const Jimp = require('jimp');

/**
 * Resize + optimize images.
 *
 * @param Array images An array of images paths.
 * @param Number width A number value of width e.g. 1920.
 * @param Number height Optional number value of height e.g. 1080.
 * @param Number quality Optional number value of quality of the image e.g. 90.
 */
module.exports = async (readImgPath, writeImgpath, width, height = Jimp.AUTO, quality) => {
	return new Promise(async (resolve) => {
        const image = await Jimp.read(readImgPath);
        await image.resize(width, height);
        await image.quality(quality);
        await image.writeAsync(writeImgpath);
        resolve();
    }      
	);
};