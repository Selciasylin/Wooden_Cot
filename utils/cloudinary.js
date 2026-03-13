const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier")
console.log("Cloud Name:", process.env.CLOUD_NAME)
console.log("API Key:", process.env.CLOUD_API_KEY)
console.log("API Secret:", process.env.CLOUD_API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

function uploadToCloudinary(buffer, folder = "wooden-cot/categories") {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

module.exports = {uploadToCloudinary};