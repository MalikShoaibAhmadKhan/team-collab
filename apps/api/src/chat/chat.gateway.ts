import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserStatus } from '../auth/schemas/user.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      this.connectedUsers.set(client.id, userId);
      
      // Update user status to online
      await this.authService.updateUserStatus(userId, UserStatus.ONLINE);
      
      // Join user to their workspace rooms
      const workspaces = await this.chatService.getUserWorkspaces(userId);
      for (const workspace of workspaces) {
        client.join(`workspace:${(workspace as any)._id.toString()}`);
      }

      // Notify others that user is online
      client.broadcast.emit('userStatusChanged', {
        userId,
        status: UserStatus.ONLINE,
        lastSeen: new Date(),
      });

      console.log(`User ${userId} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      
      // Update user status to offline
      await this.authService.updateUserStatus(userId, UserStatus.OFFLINE);
      
      // Notify others that user is offline
      client.broadcast.emit('userStatusChanged', {
        userId,
        status: UserStatus.OFFLINE,
        lastSeen: new Date(),
      });

      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        return;
      }

      const message = await this.chatService.createMessage(userId, createMessageDto);
      
      // Send message to all users in the channel's workspace
      this.server.to(`workspace:${message.workspaceId.toString()}`).emit('newMessage', message);
      
      return message;
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        return;
      }

      await this.chatService.joinChannel(data.channelId, userId);
      client.join(`channel:${data.channelId}`);
      
      client.emit('joinedChannel', { channelId: data.channelId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`channel:${data.channelId}`);
    client.emit('leftChannel', { channelId: data.channelId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { channelId: string, isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      return;
    }

    client.to(`channel:${data.channelId}`).emit('userTyping', {
      userId,
      channelId: data.channelId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @MessageBody() data: { messageId: string, emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        return;
      }

      const message = await this.chatService.addReaction(data.messageId, userId, data.emoji);
      
      this.server.to(`workspace:${message.workspaceId.toString()}`).emit('reactionAdded', {
        messageId: data.messageId,
        reactions: message.reactions,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}