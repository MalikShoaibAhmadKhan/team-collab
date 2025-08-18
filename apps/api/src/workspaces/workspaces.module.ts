import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { WorkspacesController } from './workspaces.controller'; // <-- Import
import { WorkspacesService } from './workspaces.service'; // <-- Import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  controllers: [WorkspacesController], // <-- Add Controller
  providers: [WorkspacesService], // <-- Add Service
})
export class WorkspacesModule {}