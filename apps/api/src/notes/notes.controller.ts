import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  createNote(@Body() createNoteDto: CreateNoteDto, @Request() req) {
    return this.notesService.createNote(req.user.userId, createNoteDto);
  }

  @Get('workspaces/:workspaceId')
  getWorkspaceNotes(@Param('workspaceId') workspaceId: string, @Request() req) {
    return this.notesService.getWorkspaceNotes(workspaceId, req.user.userId);
  }

  @Get('channels/:channelId')
  getChannelNotes(@Param('channelId') channelId: string, @Request() req) {
    return this.notesService.getChannelNotes(channelId, req.user.userId);
  }

  @Get('workspaces/:workspaceId/search')
  searchNotes(
    @Param('workspaceId') workspaceId: string,
    @Query('q') query: string,
    @Request() req
  ) {
    return this.notesService.searchNotes(workspaceId, req.user.userId, query);
  }

  @Get(':id')
  getNote(@Param('id') id: string, @Request() req) {
    return this.notesService.getNoteById(id, req.user.userId);
  }

  @Put(':id')
  updateNote(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Request() req) {
    return this.notesService.updateNote(id, req.user.userId, updateNoteDto);
  }

  @Delete(':id')
  deleteNote(@Param('id') id: string, @Request() req) {
    return this.notesService.deleteNote(id, req.user.userId);
  }

  @Put(':id/collaborators/:collaboratorId')
  addCollaborator(
    @Param('id') id: string,
    @Param('collaboratorId') collaboratorId: string,
    @Request() req
  ) {
    return this.notesService.addCollaborator(id, req.user.userId, collaboratorId);
  }

  @Delete(':id/collaborators/:collaboratorId')
  removeCollaborator(
    @Param('id') id: string,
    @Param('collaboratorId') collaboratorId: string,
    @Request() req
  ) {
    return this.notesService.removeCollaborator(id, req.user.userId, collaboratorId);
  }
}