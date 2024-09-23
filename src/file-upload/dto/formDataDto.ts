import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FormDataDTO {
  @IsNotEmpty()
  @IsNumber()
  chunkIndex: number;

  @IsNotEmpty()
  @IsNumber()
  totalChunks: number;

  @IsNotEmpty()
  @IsString()
  originalFileName: string;
}
