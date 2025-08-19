import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './schemas/note.schema';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { Channel, ChannelSchema } from '../workspaces/schemas/channel.schema';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}