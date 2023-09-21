import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { JwtPayload, Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import { IMeResponse } from './types/user.type';
import { AuthDtoSignIn, AuthDtoSignUp } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private async getUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hash) throw new ForbiddenException('Access denied');

    return user;
  }

  async signupLocal(dto: AuthDtoSignUp): Promise<Tokens> {
    const hash = await argon.hash(dto.password);

    const newUser = await this.prisma.user
      .create({
        data: {
          email: dto.email,
          hash,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('This E-mail is already in use.');
          }
        }
        throw error;
      });

    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRtHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async signinLocal(dto: AuthDtoSignIn): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user)
      throw new ForbiddenException('E-mail not found in our database.');

    const passwordMatches = await argon.verify(user.hash, dto.password);

    if (!passwordMatches) throw new ForbiddenException('Password incorret.');

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async me(userId: number): Promise<IMeResponse> {
    const user = await this.getUser(userId);

    const responseData: IMeResponse = {
      id: user.id,
      email: user.email,
    };

    return responseData;
  }

  async logout(userId: number): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    return true;
  }

  async refreshTokens(userId: number, refresh_token: string) {
    const user = await this.getUser(userId);

    const rtMatches = await argon.verify(user.hashedRt, refresh_token);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  //update refresh_token function;
  async updateRtHash(userId: number, refresh_token: string) {
    const hash = await argon.hash(refresh_token);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  //get tokens from jwt service.
  async getTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
