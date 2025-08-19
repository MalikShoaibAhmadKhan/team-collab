import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Channel, ChannelDocument } from '../workspaces/schemas/channel.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async createMessage(userId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: createMessageDto.channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    });

    if (!channel) {
      throw new NotFoundException('Channel not found or access denied');
    }

    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: channel.workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const message = new this.messageModel({
      ...createMessageDto,
      senderId: userId,
      workspaceId: channel.workspaceId,
    });

    const savedMessage = await message.save();
    return this.messageModel.findById(savedMessage._id)
      .populate('senderId', 'username profilePicture')
      .populate('replyTo')
      .exec();
  }

  async getChannelMessages(channelId: string, userId: string, page = 1, limit = 50): Promise<Message[]> {
    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    });

    if (!channel) {
      throw new NotFoundException('Channel not found or access denied');
    }

    const skip = (page - 1) * limit;

    return this.messageModel.find({
      channelId,
      isDeleted: false
    })
    .populate('senderId', 'username profilePicture')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.messageModel.findOne({
      _id: messageId,
      senderId: userId,
      isDeleted: false
    });

    if (!message) {
      throw new NotFoundException('Message not found or you cannot edit this message');
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    return message.save();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findOne({
      _id: messageId,
      senderId: userId,
      isDeleted: false
    });

    if (!message) {
      throw new NotFoundException('Message not found or you cannot delete this message');
    }

    message.isDeleted = true;
    await message.save();
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(u => u.toString() === userId);
      if (userIndex > -1) {
        // Remove reaction
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to existing reaction
        existingReaction.users.push(new Types.ObjectId(userId));
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [new Types.ObjectId(userId)]
      });
    }

    return message.save();
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return this.workspaceModel.find({
      'members.userId': userId,
      isActive: true
    }).exec();
  }

  async joinChannel(channelId: string, userId: string): Promise<void> {
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
  }

  async searchMessages(workspaceId: string, userId: string, query: string): Promise<Message[]> {
    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.messageModel.find({
      workspaceId,
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    })
    .populate('senderId', 'username profilePicture')
    .populate('channelId', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .exec();
  }
}