import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SECRET_KEY', // Must be the SAME secret as in auth.module.ts
    });
  }

  async validate(payload: any) {
    // The payload is the decoded JWT.
    // NestJS will attach this to the request object as request.user
    return { userId: payload.sub, email: payload.email };
  }
}