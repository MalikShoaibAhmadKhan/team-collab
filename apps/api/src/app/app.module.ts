// In apps/api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChatModule } from '../chat/chat.module';
import { TasksModule } from '../tasks/tasks.module';
import { NotesModule } from '../notes/notes.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    WorkspacesModule,
    ChatModule,
    TasksModule,
    NotesModule,
    MongooseModule.forRoot('mongodb://localhost:27017/team-collab-db'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}