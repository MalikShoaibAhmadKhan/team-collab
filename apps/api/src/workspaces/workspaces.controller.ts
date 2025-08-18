import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @UseGuards(AuthGuard('jwt')) // <-- Protect this endpoint
  @Post() // Handles POST requests to /api/workspaces
  create(@Body() body: { name: string }, @Request() req) {
    // req.user is attached by our JwtStrategy
    return this.workspacesService.create(body.name, req.user);
  }
}