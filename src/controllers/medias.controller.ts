import { NextFunction, Request, Response } from "express";
import formidable from "formidable";
import path from "path";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from "~/constants/dir";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import MediaService from "~/services/medias.service";
import fs from 'fs';
// import mime from 'mime';



export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await MediaService.handleUploadImage({ req });

  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    url
  });

  return;
}

export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  console.log('serveImageController >> path:', path.resolve(UPLOAD_IMAGE_DIR, name));
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    console.log('err:', err);
    if (err) {
      res.status(404).send('Not Found')
    }
  });
  return;
}


export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  await fakeLongTask();
  const url = await MediaService.handleUploadVideo({ req });

  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    url
  });

  return;
}

export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  res.sendFile(path.resolve(UPLOAD_VIDEO_TEMP_DIR, name), (err) => {

    console.log('err:', err);
    if (err) {
      res.status(404).send('Not Found')
    }
  });
  return;
}

export const serveVideoStreamController = async (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range;
  if (!range) {
    res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header');
    return;
  }
  

  const { name } = req.params;
  const videoPath = path.resolve(UPLOAD_VIDEO_TEMP_DIR, name);

  // Tính dung lượng video (byte)
  const videoSize = fs.statSync(videoPath).size

  // Dung lương cho mỗi phân đoạn
  const chunkSize = 10 ** 6;

  // Lấy giá trị byte bắt đầu từ header Range (ex: bytes=1048576-)
  const start = Number(range.replace(/\D/g, ''));

  // Lấy giá trị byte kết thúc
  const end = Math.min(start + chunkSize, videoSize - 1);

  // Tính dung lương cho mỗi đoạn video
  const contentLength = end - start + 1;

  const mime = (await import('mime')).default
  const contentType = mime.getType(videoPath) || 'video/*';

  // console.log('mime.getType(videoPath)',mime.getType(videoPath))

  /**
   * Format của header Content-Range: bytes <start>-<end>/<videoSize>
   * Ví dụ: Content-Range: bytes 1048576-3145727/3145728
   * Yêu cầu là `end` phải luôn luôn nhỏ hơn `videoSize`
   * ❌ 'Content-Range': 'bytes 0-100/100'
   * ✅ 'Content-Range': 'bytes 0-99/100'
   *
   * Còn Content-Length sẽ là end - start + 1. Đại diện cho khoản cách.
   * Để dễ hình dung, mọi người tưởng tượng từ số 0 đến số 10 thì ta có 11 số.
   * byte cũng tương tự, nếu start = 0, end = 10 thì ta có 11 byte.
   * Công thức là end - start + 1
   *
   * ChunkSize = 50
   * videoSize = 100
   * |0----------------50|51----------------99|100 (end)
   * stream 1: start = 0, end = 50, contentLength = 51
   * stream 2: start = 51, end = 99, contentLength = 49
   */
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoSteams = fs.createReadStream(videoPath, { start, end })
  videoSteams.pipe(res)
  return;
}


/**
 * Description. Fake a long task
 * 
 */
export const fakeLongTask = async () => {
  return new Promise((resolve,reject)=> {
    setTimeout(()=>{
      resolve(true);
    },10000)
  })
}