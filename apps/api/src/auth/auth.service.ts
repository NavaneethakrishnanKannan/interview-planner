import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(payload: { email: string; password: string; name?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existingUser) throw new UnauthorizedException('Email already exists');

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: { email: payload.email, name: payload.name, passwordHash },
    });
    return this.issueTokens(user);
  }

  async login(payload: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
        },
      );
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(user: User) {
    const basePayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(basePayload);
    const refreshToken = await this.jwtService.signAsync(basePayload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: '7d',
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
