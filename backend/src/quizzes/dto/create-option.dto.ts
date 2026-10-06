import { IsBoolean } from 'class-validator';
import { IsRequiredText } from '../../common/validation/decorators';
import { QUIZ_LIMITS } from '../quizzes.constants';

export class CreateOptionDto {
  @IsRequiredText(QUIZ_LIMITS.optionTextMaxLength)
  text!: string;

  @IsBoolean({ message: '$property must be a boolean' })
  isCorrect!: boolean;
}
