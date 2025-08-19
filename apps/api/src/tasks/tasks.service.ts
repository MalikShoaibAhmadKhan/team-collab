import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { Channel, ChannelDocument } from '../workspaces/schemas/channel.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/schemas/workspace.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async createTask(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: createTaskDto.channelId,
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

    // Get the highest position for the TODO status
    const lastTask = await this.taskModel.findOne({
      channelId: createTaskDto.channelId,
      status: TaskStatus.TODO
    }).sort({ position: -1 });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = new this.taskModel({
      ...createTaskDto,
      createdBy: userId,
      workspaceId: channel.workspaceId,
      position,
      activityLog: [{
        action: 'created',
        userId: new Types.ObjectId(userId),
        timestamp: new Date(),
        details: 'Task created'
      }]
    });

    const savedTask = await task.save();
    return this.taskModel.findById(savedTask._id)
      .populate('createdBy', 'username profilePicture')
      .populate('assignedTo', 'username profilePicture')
      .exec();
  }

  async getChannelTasks(channelId: string, userId: string): Promise<{
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  }> {
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

    const tasks = await this.taskModel.find({
      channelId,
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('assignedTo', 'username profilePicture')
    .sort({ position: 1 })
    .exec();

    return {
      todo: tasks.filter(task => task.status === TaskStatus.TODO),
      inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
      done: tasks.filter(task => task.status === TaskStatus.DONE),
    };
  }

  async updateTask(taskId: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      isActive: true
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: task.channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    });

    if (!channel) {
      throw new ForbiddenException('Access denied');
    }

    // Log the activity
    const activityDetails = [];
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      activityDetails.push(`Status changed from ${task.status} to ${updateTaskDto.status}`);
    }
    if (updateTaskDto.assignedTo && updateTaskDto.assignedTo !== task.assignedTo?.toString()) {
      activityDetails.push('Assignment changed');
    }
    if (updateTaskDto.priority && updateTaskDto.priority !== task.priority) {
      activityDetails.push(`Priority changed to ${updateTaskDto.priority}`);
    }

    if (activityDetails.length > 0) {
      task.activityLog.push({
        action: 'updated',
        userId: new Types.ObjectId(userId),
        timestamp: new Date(),
        details: activityDetails.join(', ')
      });
    }

    // Update task
    Object.assign(task, updateTaskDto);
    await task.save();

    return this.taskModel.findById(taskId)
      .populate('createdBy', 'username profilePicture')
      .populate('assignedTo', 'username profilePicture')
      .exec();
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      isActive: true
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only creator or assigned user can delete
    if (task.createdBy.toString() !== userId && task.assignedTo?.toString() !== userId) {
      throw new ForbiddenException('You can only delete tasks you created or are assigned to');
    }

    task.isActive = false;
    task.activityLog.push({
      action: 'deleted',
      userId: new Types.ObjectId(userId),
      timestamp: new Date(),
      details: 'Task deleted'
    });

    await task.save();
  }

  async moveTask(taskId: string, userId: string, newStatus: TaskStatus, newPosition: number): Promise<Task> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      isActive: true
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: task.channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    });

    if (!channel) {
      throw new ForbiddenException('Access denied');
    }

    const oldStatus = task.status;
    
    // Update positions of other tasks
    if (newStatus !== oldStatus) {
      // Remove from old position
      await this.taskModel.updateMany(
        {
          channelId: task.channelId,
          status: oldStatus,
          position: { $gt: task.position }
        },
        { $inc: { position: -1 } }
      );

      // Make space in new position
      await this.taskModel.updateMany(
        {
          channelId: task.channelId,
          status: newStatus,
          position: { $gte: newPosition }
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving within same status
      if (newPosition > task.position) {
        await this.taskModel.updateMany(
          {
            channelId: task.channelId,
            status: newStatus,
            position: { $gt: task.position, $lte: newPosition }
          },
          { $inc: { position: -1 } }
        );
      } else {
        await this.taskModel.updateMany(
          {
            channelId: task.channelId,
            status: newStatus,
            position: { $gte: newPosition, $lt: task.position }
          },
          { $inc: { position: 1 } }
        );
      }
    }

    // Update the task
    task.status = newStatus;
    task.position = newPosition;
    
    if (newStatus !== oldStatus) {
      task.activityLog.push({
        action: 'moved',
        userId: new Types.ObjectId(userId),
        timestamp: new Date(),
        details: `Moved from ${oldStatus} to ${newStatus}`
      });
    }

    await task.save();

    return this.taskModel.findById(taskId)
      .populate('createdBy', 'username profilePicture')
      .populate('assignedTo', 'username profilePicture')
      .exec();
  }

  async getTaskById(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('assignedTo', 'username profilePicture')
    .populate('activityLog.userId', 'username profilePicture')
    .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user has access to the channel
    const channel = await this.channelModel.findOne({
      _id: task.channelId,
      $or: [
        { type: 'public' },
        { members: userId }
      ],
      isActive: true
    });

    if (!channel) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return this.taskModel.find({
      assignedTo: userId,
      isActive: true
    })
    .populate('createdBy', 'username profilePicture')
    .populate('channelId', 'name')
    .populate('workspaceId', 'name')
    .sort({ dueDate: 1, createdAt: -1 })
    .exec();
  }
}