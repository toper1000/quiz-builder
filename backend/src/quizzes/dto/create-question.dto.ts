import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { IsArrayOfSize, IsRequiredText } from '../../common/validation/decorators';
import { QUIZ_LIMITS } from '../quizzes.constants';
import {
  HasCorrectOption,
  HasUniqueOptionTexts,
  IsAnswerForType,
} from '../validators/question-type.validators';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @IsEnum(QuestionType, {
    message: `$property must be one of: ${Object.values(QuestionType).join(', ')}`,
  })
  type!: QuestionType;

  @IsRequiredText(QUIZ_LIMITS.questionTextMaxLength)
  text!: string;

  @IsAnswerForType(QuestionType.BOOLEAN, IsBoolean({ message: '$property must be a boolean' }))
  correctBoolean?: boolean;

  @IsAnswerForType(QuestionType.INPUT, IsRequiredText(QUIZ_LIMITS.answerTextMaxLength))
  correctText?: string;

  @IsAnswerForType(
    QuestionType.CHECKBOX,
    IsArrayOfSize(QUIZ_LIMITS.minOptions, QUIZ_LIMITS.maxOptions),
    HasCorrectOption(),
    HasUniqueOptionTexts(),
  )
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
