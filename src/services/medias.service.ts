import { Request } from "express";
import sharp from "sharp";
import { UPLOAD_IMAGE_DIR } from "~/constants/dir";
import { getNameFromFullName, handleUploadImage as utilsHandleUploadImage, handleUploadVideo as utilsHandleUploadVideo } from '~/utils/file'
import fs from 'fs'

import { isPorduction } from "~/constants/config";
import { MediaType } from "~/constants/enum";
import path from "path";

const handleUploadImage = async (payload: { req: Request }) => {
  const { req } = payload;
  const files = await utilsHandleUploadImage(req);

  const result: any[] = await Promise.all(files.map(async (file) => {
    const newName = getNameFromFullName(file.newFilename);
    const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`);

    const file_filepath = file.filepath;
    await sharp(file_filepath).jpeg()
      .toFile(newPath);
    await fs.unlinkSync(file_filepath);


    let image_url = '';
    if (isPorduction) {
      image_url = `${process.env.HOST}/static/${newName}.jpg`
    } else {
      image_url = `http://localhost:${process.env.PORT}/static/${newName}.jpg`
    }

    return {
      url: image_url,
      type: MediaType.Image
    }
  }));

  return result
}

const handleUploadVideo = async (payload: { req: Request }) => {
  const { req } = payload;
  const files = await utilsHandleUploadVideo(req);

  const result = files.map((file)=>{
    const { newFilename,filepath } = file;

    let video_url = '';
    if (isPorduction) {
      video_url = `${process.env.HOST}/static/video/${newFilename}`
    } else {
      video_url = `http://localhost:${process.env.PORT}/static/video/${newFilename}`
    }
  
    // await fs.unlinkSync(filepath);
    return {
      url: video_url,
      type: MediaType.Video
    }
  })

  return result
}

const MediaService = {
  handleUploadImage,
  handleUploadVideo
};
export default MediaService;