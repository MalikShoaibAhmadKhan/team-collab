// In apps/api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module'; // <-- Add this import

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AuthModule, // <-- Add this line
    MongooseModule.forRoot('mongodb://localhost:27017/team-collab-db')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}