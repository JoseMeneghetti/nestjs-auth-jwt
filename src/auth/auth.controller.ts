import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Tokens } from './types';
import { RtGuard } from 'src/common/guards';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/common/decorators';
import { IMeResponse } from './types/user.type';
import { AuthDtoSignIn, AuthDtoSignUp } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() dto: AuthDtoSignUp): Promise<Tokens> {
    return this.authService.signupLocal(dto);
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('local/signin')
  signinLocal(@Body() dto: AuthDtoSignIn): Promise<Tokens> {
    return this.authService.signinLocal(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@GetCurrentUserId() userId: number): Promise<IMeResponse> {
    return this.authService.me(userId);
  }
}
