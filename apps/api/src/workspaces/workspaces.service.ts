import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument, MemberRole } from './schemas/workspace.schema';
import { Channel, ChannelDocument } from './schemas/channel.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createWorkspace(userId: string, createWorkspaceDto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = new this.workspaceModel({
      ...createWorkspaceDto,
      createdBy: userId,
      members: [{
        userId: new Types.ObjectId(userId),
        role: MemberRole.ADMIN,
        joinedAt: new Date()
      }]
    });

    const savedWorkspace = await workspace.save();
    
    // Create a default general channel
    await this.createChannel(userId, savedWorkspace._id.toString(), {
      name: 'general',
      description: 'General discussion channel',
    });

    return savedWorkspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return this.workspaceModel.find({
      'members.userId': userId,
      isActive: true
    }).populate('createdBy', 'username email').exec();
  }

  async getWorkspaceById(workspaceId: string, userId: string): Promise<Workspace> {
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId,
      isActive: true
    }).populate('members.userId', 'username email profilePicture status').exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async addMember(workspaceId: string, addMemberDto: AddMemberDto, requesterId: string): Promise<Workspace> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if requester is admin
    const requesterMember = workspace.members.find(m => m.userId.toString() === requesterId);
    if (!requesterMember || requesterMember.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can add members');
    }

    // Find user by email
    const user = await this.userModel.findOne({ email: addMemberDto.email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(m => m.userId.toString() === user._id.toString());
    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    workspace.members.push({
      userId: user._id,
      role: addMemberDto.role || MemberRole.MEMBER,
      joinedAt: new Date()
    });

    return workspace.save();
  }

  async createChannel(userId: string, workspaceId: string, createChannelDto: CreateChannelDto): Promise<Channel> {
    // Check if user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const channel = new this.channelModel({
      ...createChannelDto,
      workspaceId,
      createdBy: userId,
      members: [userId] // Creator is automatically a member
    });

    return channel.save();
  }

  async getWorkspaceChannels(workspaceId: string, userId: string): Promise<Channel[]> {
    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.channelModel.find({
      workspaceId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    }).populate('createdBy', 'username').exec();
  }

  async getChannelById(channelId: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findOne({
      _id: channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    }).populate('createdBy', 'username').exec();

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  async joinChannel(channelId: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: channel.workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!channel.members.includes(new Types.ObjectId(userId))) {
      channel.members.push(new Types.ObjectId(userId));
      await channel.save();
    }

    return channel;
  }
}