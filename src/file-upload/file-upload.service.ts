import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FormDataDTO } from './dto/formDataDto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private uploadDir = path.join('./', 'tempUploads');
  private uploadsDir = path.join('./', 'public/uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async chunk(file: Express.Multer.File, formDataDTO: FormDataDTO) {
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const direction = file.mimetype.split('/')[0];
    const fileExtension = file.mimetype.split('/')[1];
    const publicDirection = `${this.uploadsDir}/${direction}`;
    const fileName = uuidv4();
    const filePath = `${publicDirection}/${fileName}.${fileExtension}`;

    for (let i = 0; i < totalChunks; i++) {
      const chunkFilePath = path.join(
        this.uploadDir,
        `${formDataDTO.originalFileName}.part${i + 1}.bin`,
      );

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunkBuffer = file.buffer.slice(start, end);

      await fs.promises.writeFile(chunkFilePath, chunkBuffer);
    }

    if (this.checkIfAllChunksExist(formDataDTO.originalFileName, totalChunks)) {
      this.mergeChunks(
        formDataDTO.originalFileName,
        totalChunks,
        filePath,
        publicDirection,
      );
      this.deleteChunks(formDataDTO.originalFileName, totalChunks);
    }
  }

  checkIfAllChunksExist(
    originalFileName: string,
    totalChunks: number,
  ): boolean {
    for (let i = 1; i <= totalChunks; i++) {
      const chunkFilePath = path.join(
        this.uploadDir,
        `${originalFileName}.part${i}.bin`,
      );
      if (!fs.existsSync(chunkFilePath)) {
        return false;
      }
    }
    return true;
  }

  mergeChunks(
    originalFileName: string,
    totalChunks: number,
    filePath: string,
    publicDirection: string,
  ) {
    try {
      if (!fs.existsSync(publicDirection))
        fs.mkdirSync(publicDirection, { recursive: true });
      const writeStream = fs.createWriteStream(filePath);

      for (let i = 1; i <= totalChunks; i++) {
        const chunkFilePath = path.join(
          this.uploadDir,
          `${originalFileName}.part${i}.bin`,
        );
        const chunkBuffer = fs.readFileSync(chunkFilePath);
        writeStream.write(chunkBuffer);
      }

      writeStream.end();
    } catch (err) {
      throw new HttpException('Merged Successfully', HttpStatus.CREATED);
    }
  }
  deleteChunks(originalFileName: string, totalChunks: number) {
    for (let i = 1; i <= totalChunks; i++) {
      const chunkFilePath = path.join(
        this.uploadDir,
        `${originalFileName}.part${i}.bin`,
      );

      if (fs.existsSync(chunkFilePath)) {
        fs.unlinkSync(chunkFilePath);
      }
    }
  }
}
