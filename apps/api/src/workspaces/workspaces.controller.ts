import { Controller, Post, Body, Request, UseGuards, Get, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.createWorkspace(req.user.userId, createWorkspaceDto);
  }

  @Get()
  getUserWorkspaces(@Request() req) {
    return this.workspacesService.getUserWorkspaces(req.user.userId);
  }

  @Get(':id')
  getWorkspace(@Param('id') id: string, @Request() req) {
    return this.workspacesService.getWorkspaceById(id, req.user.userId);
  }

  @Put(':id/members')
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.workspacesService.addMember(id, addMemberDto, req.user.userId);
  }

  @Post(':id/channels')
  createChannel(@Param('id') workspaceId: string, @Body() createChannelDto: CreateChannelDto, @Request() req) {
    return this.workspacesService.createChannel(req.user.userId, workspaceId, createChannelDto);
  }

  @Get(':id/channels')
  getWorkspaceChannels(@Param('id') workspaceId: string, @Request() req) {
    return this.workspacesService.getWorkspaceChannels(workspaceId, req.user.userId);
  }

  @Get('channels/:channelId')
  getChannel(@Param('channelId') channelId: string, @Request() req) {
    return this.workspacesService.getChannelById(channelId, req.user.userId);
  }

  @Put('channels/:channelId/join')
  joinChannel(@Param('channelId') channelId: string, @Request() req) {
    return this.workspacesService.joinChannel(channelId, req.user.userId);
  }
}