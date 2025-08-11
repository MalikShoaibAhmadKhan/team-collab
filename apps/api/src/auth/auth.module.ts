// In apps/api/src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // Configure the JwtModule
    JwtModule.register({
      global: true, // Makes the JWT services available application-wide
      secret: 'YOUR_SECRET_KEY', // IMPORTANT: Replace with a real secret key, we'll use environment variables later
      signOptions: { expiresIn: '60m' }, // Token expires in 60 minutes
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}