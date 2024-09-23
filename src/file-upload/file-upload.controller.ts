import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { FormDataDTO } from './dto/formDataDto';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() formDataDTO: FormDataDTO,
  ) {
    return this.fileUploadService.chunk(file, formDataDTO);
  }
}
