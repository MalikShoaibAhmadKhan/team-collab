import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.chatService.createMessage(req.user.userId, createMessageDto);
  }

  @Get('channels/:channelId/messages')
  getChannelMessages(
    @Param('channelId') channelId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req
  ) {
    return this.chatService.getChannelMessages(channelId, req.user.userId, page, limit);
  }

  @Put('messages/:messageId')
  editMessage(
    @Param('messageId') messageId: string,
    @Body('content') content: string,
    @Request() req
  ) {
    return this.chatService.editMessage(messageId, req.user.userId, content);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    return this.chatService.deleteMessage(messageId, req.user.userId);
  }

  @Get('workspaces/:workspaceId/search')
  searchMessages(
    @Param('workspaceId') workspaceId: string,
    @Query('q') query: string,
    @Request() req
  ) {
    return this.chatService.searchMessages(workspaceId, req.user.userId, query);
  }
}