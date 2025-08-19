import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import { Channel, ChannelDocument } from '../workspaces/schemas/channel.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
  ) {}

  async createNote(userId: string, createNoteDto: CreateNoteDto): Promise<Note> {
    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: createNoteDto.workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // If channelId is provided, verify access
    if (createNoteDto.channelId) {
      const channel = await this.channelModel.findOne({
        _id: createNoteDto.channelId,
        workspaceId: createNoteDto.workspaceId,
        $or: [
          { type: 'public' },
          { members: userId }
        ],
        isActive: true
      });

      if (!channel) {
        throw new NotFoundException('Channel not found or access denied');
      }
    }

    const note = new this.noteModel({
      ...createNoteDto,
      createdBy: userId,
      collaborators: [userId, ...(createNoteDto.collaborators || [])],
      revisionHistory: [{
        userId: new Types.ObjectId(userId),
        action: 'created',
        timestamp: new Date(),
        changes: 'Note created'
      }]
    });

    const savedNote = await note.save();
    return this.noteModel.findById(savedNote._id)
      .populate('createdBy', 'username profilePicture')
      .populate('collaborators', 'username profilePicture')
      .exec();
  }

  async getWorkspaceNotes(workspaceId: string, userId: string): Promise<Note[]> {
    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.noteModel.find({
      workspaceId,
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('collaborators', 'username profilePicture')
    .populate('channelId', 'name')
    .sort({ isPinned: -1, updatedAt: -1 })
    .exec();
  }

  async getChannelNotes(channelId: string, userId: string): Promise<Note[]> {
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

    return this.noteModel.find({
      channelId,
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('collaborators', 'username profilePicture')
    .sort({ isPinned: -1, updatedAt: -1 })
    .exec();
  }

  async getNoteById(noteId: string, userId: string): Promise<Note> {
    const note = await this.noteModel.findOne({
      _id: noteId,
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('collaborators', 'username profilePicture')
    .populate('revisionHistory.userId', 'username profilePicture')
    .exec();

    if (!note) {
      throw new NotFoundException('Note not found or access denied');
    }

    return note;
  }

  async updateNote(noteId: string, userId: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const note = await this.noteModel.findOne({
      _id: noteId,
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ],
      isActive: true
    });

    if (!note) {
      throw new NotFoundException('Note not found or access denied');
    }

    // Track changes for revision history
    const changes = [];
    if (updateNoteDto.title && updateNoteDto.title !== note.title) {
      changes.push(`Title changed from "${note.title}" to "${updateNoteDto.title}"`);
    }
    if (updateNoteDto.content && updateNoteDto.content !== note.content) {
      changes.push('Content updated');
    }
    if (updateNoteDto.isPinned !== undefined && updateNoteDto.isPinned !== note.isPinned) {
      changes.push(updateNoteDto.isPinned ? 'Note pinned' : 'Note unpinned');
    }

    // Update note
    Object.assign(note, updateNoteDto);

    // Add revision history entry
    if (changes.length > 0) {
      note.revisionHistory.push({
        userId: new Types.ObjectId(userId),
        action: 'updated',
        timestamp: new Date(),
        changes: changes.join(', ')
      });
    }

    await note.save();

    return this.noteModel.findById(noteId)
      .populate('createdBy', 'username profilePicture')
      .populate('collaborators', 'username profilePicture')
      .exec();
  }

  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await this.noteModel.findOne({
      _id: noteId,
      createdBy: userId, // Only creator can delete
      isActive: true
    });

    if (!note) {
      throw new NotFoundException('Note not found or you do not have permission to delete it');
    }

    note.isActive = false;
    note.revisionHistory.push({
      userId: new Types.ObjectId(userId),
      action: 'deleted',
      timestamp: new Date(),
      changes: 'Note deleted'
    });

    await note.save();
  }

  async addCollaborator(noteId: string, userId: string, collaboratorId: string): Promise<Note> {
    const note = await this.noteModel.findOne({
      _id: noteId,
      createdBy: userId, // Only creator can add collaborators
      isActive: true
    });

    if (!note) {
      throw new NotFoundException('Note not found or you do not have permission to modify it');
    }

    if (!note.collaborators.includes(new Types.ObjectId(collaboratorId))) {
      note.collaborators.push(new Types.ObjectId(collaboratorId));
      note.revisionHistory.push({
        userId: new Types.ObjectId(userId),
        action: 'collaborator_added',
        timestamp: new Date(),
        changes: 'Collaborator added'
      });
      await note.save();
    }

    return this.noteModel.findById(noteId)
      .populate('createdBy', 'username profilePicture')
      .populate('collaborators', 'username profilePicture')
      .exec();
  }

  async removeCollaborator(noteId: string, userId: string, collaboratorId: string): Promise<Note> {
    const note = await this.noteModel.findOne({
      _id: noteId,
      createdBy: userId, // Only creator can remove collaborators
      isActive: true
    });

    if (!note) {
      throw new NotFoundException('Note not found or you do not have permission to modify it');
    }

    note.collaborators = note.collaborators.filter(
      id => id.toString() !== collaboratorId
    );

    note.revisionHistory.push({
      userId: new Types.ObjectId(userId),
      action: 'collaborator_removed',
      timestamp: new Date(),
      changes: 'Collaborator removed'
    });

    await note.save();

    return this.noteModel.findById(noteId)
      .populate('createdBy', 'username profilePicture')
      .populate('collaborators', 'username profilePicture')
      .exec();
  }

  async searchNotes(workspaceId: string, userId: string, query: string): Promise<Note[]> {
    // Verify user is member of workspace
    const workspace = await this.workspaceModel.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.noteModel.find({
      workspaceId,
      $or: [
        { createdBy: userId },
        { collaborators: userId }
      ],
      $and: [
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ],
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('collaborators', 'username profilePicture')
    .populate('channelId', 'name')
    .sort({ updatedAt: -1 })
    .limit(20)
    .exec();
  }
}