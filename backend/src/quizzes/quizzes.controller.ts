import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';
import type { QuizDetails, QuizSummary } from './quizzes.types';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  create(@Body() createQuizDto: CreateQuizDto): Promise<QuizDetails> {
    return this.quizzesService.create(createQuizDto);
  }

  @Get()
  findAll(): Promise<QuizSummary[]> {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string): Promise<QuizDetails> {
    return this.quizzesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.quizzesService.remove(id);
  }
}
