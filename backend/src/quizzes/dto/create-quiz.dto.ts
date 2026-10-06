import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { IsArrayOfSize, IsRequiredText } from '../../common/validation/decorators';
import { QUIZ_LIMITS } from '../quizzes.constants';
import { CreateQuestionDto } from './create-question.dto';

export class CreateQuizDto {
  @IsRequiredText(QUIZ_LIMITS.titleMaxLength)
  title!: string;

  @IsArrayOfSize(QUIZ_LIMITS.minQuestions, QUIZ_LIMITS.maxQuestions)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}
