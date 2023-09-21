import { IsNotEmpty, IsEmail, Validate } from 'class-validator';
import { isStrongPassword } from 'class-validator';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isStrongPassword(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a strong password`;
        },
      },
    });
  };
}

export class AuthDtoSignUp {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}

export class AuthDtoSignIn {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
