// In apps/api/src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService, // Inject the JWT Service
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
      const newUser = new this.userModel({
        email: createUserDto.email,
        password: hashedPassword,
        username: createUserDto.username,
        bio: createUserDto.bio || '',
        profilePicture: createUserDto.profilePicture || '',
        status: UserStatus.OFFLINE,
      });
      return newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }
  
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }
  
  async login(user: any) {
    // Update user status to online and last seen
    await this.userModel.findByIdAndUpdate(user._id, {
      status: UserStatus.ONLINE,
      lastSeen: new Date(),
    });

    const payload = { email: user.email, sub: user._id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        status: UserStatus.ONLINE,
      },
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { ...updateProfileDto, lastSeen: new Date() },
      { new: true }
    ).select('-password').exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      status,
      lastSeen: new Date(),
    });
  }

  async findUsersByIds(userIds: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: userIds } }).select('-password').exec();
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }).select('-password').limit(10).exec();
  }
}