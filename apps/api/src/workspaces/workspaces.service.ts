import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
// The 'User' type here is just for type-hinting, our 'owner' object has userId and email
import { User } from '../auth/schemas/user.schema'; 

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  // The 'owner' parameter will be the user object from the JWT: { userId: string, email: string }
  async create(name: string, owner: { userId: string, email: string }): Promise<Workspace> {
    const newWorkspace = new this.workspaceModel({
      name,
      owner: owner.userId, // <-- Use just the userId
      members: [owner.userId], // <-- Use just the userId
    });
    return newWorkspace.save();
  }
}

