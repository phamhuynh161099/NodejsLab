import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';


export const initFolder = () => {
  // Kiểm tra thư mục <parent>/uploads có tồn tại không
  [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFieldsSize: 300 * 1024 * 1024, // 300 MB
    maxTotalFileSize: 4 * 300 * 1024 * 1024, // 4 * 300MD
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));

      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      if (!Boolean(files.image)) {
        reject(new Error('File is empty'));
        return;
      }

      resolve((files.image as File[]));
    });
  })

}


export const getNameFromFullName = (fullname: string) => {
  const name_arr = fullname.split('.');
  name_arr.pop();
  return name_arr.join('.');
}

export const handleUploadVideo = async (req: Request) => {

  const nanoId = (await import('nanoid')).nanoid;
  const idName = nanoId();

  const folderPath = path.resolve(UPLOAD_VIDEO_TEMP_DIR, idName);
  fs.mkdirSync(folderPath);

  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    // keepExtensions: true,
    maxFieldsSize: 300 * 1024 * 1024, // 300 MB
    // maxTotalFileSize : 4 * 300 * 1024 * 1024, // 4 * 300MD
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));

      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    },
    filename: (filename, ext) => {
      return idName;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      if (!Boolean(files.video)) {
        reject(new Error('File is empty'));
        return;
      }

      const videos = files.video as File[];
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string);
        fs.renameSync(video.filepath, video.filepath + '.' + ext);
        video.newFilename = video.newFilename + '.' + ext;
      })

      resolve((files.video as File[]));
    });
  })

}

export const getExtension = (fullname: string) => {
  const name_arr = fullname.split('.');
  return name_arr[name_arr.length - 1];
}

