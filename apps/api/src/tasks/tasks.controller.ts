import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './schemas/task.schema';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.createTask(req.user.userId, createTaskDto);
  }

  @Get('channels/:channelId')
  getChannelTasks(@Param('channelId') channelId: string, @Request() req) {
    return this.tasksService.getChannelTasks(channelId, req.user.userId);
  }

  @Get('my-tasks')
  getUserTasks(@Request() req) {
    return this.tasksService.getUserTasks(req.user.userId);
  }

  @Get(':id')
  getTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.getTaskById(id, req.user.userId);
  }

  @Put(':id')
  updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.updateTask(id, req.user.userId, updateTaskDto);
  }

  @Put(':id/move')
  moveTask(
    @Param('id') id: string,
    @Body() body: { status: TaskStatus; position: number },
    @Request() req
  ) {
    return this.tasksService.moveTask(id, req.user.userId, body.status, body.position);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.deleteTask(id, req.user.userId);
  }
}