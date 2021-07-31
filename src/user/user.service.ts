import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from 'src/user/user.schema';
import { UserDocument, UserDocumentFull } from 'src/user/user.interface';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { IErrors } from 'src/message/message.interface';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { RoleEntity } from 'src/role/role.schema';
import { PermissionEntity } from 'src/permission/permission.schema';
import { Types } from 'mongoose';
import { UserTransformer } from './transformer/user.transformer';
import { classToPlain, plainToClass } from 'class-transformer';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserDocument>,
        @Hash() private readonly hashService: HashService,
        @Message() private readonly messageService: MessageService
    ) {}

    async findAll<T>(
        find?: Record<string, any>,
        options?: Record<string, any>
    ): Promise<T[]> {
        const findAll = this.userModel
            .find(find)
            .select('-__v')
            .skip(options && options.skip ? options.skip : 0);

        if (options && options.limit) {
            findAll.limit(options.limit);
        }

        if (options && options.populate) {
            findAll.populate({
                path: 'role',
                model: RoleEntity.name,
                match: { isActive: true },
                select: '-__v',
                populate: {
                    path: 'permissions',
                    model: PermissionEntity.name,
                    match: { isActive: true },
                    select: '-__v'
                }
            });
        }

        return findAll.lean();
    }

    async totalData(find?: Record<string, any>): Promise<number> {
        return this.userModel.countDocuments(find);
    }

    async safe(data: UserDocumentFull): Promise<Record<string, any>> {
        return plainToClass(UserTransformer, data);
    }

    async findOneById<T>(userId: string, populate?: boolean): Promise<T> {
        const user = this.userModel.findById(userId).select('-__v');

        if (populate) {
            user.populate({
                path: 'role',
                model: RoleEntity.name,
                match: { isActive: true },
                select: '-__v',
                populate: {
                    path: 'permissions',
                    model: PermissionEntity.name,
                    match: { isActive: true },
                    select: '-__v'
                }
            });
        }

        return user.lean();
    }

    async findOne<T>(
        find?: Record<string, any>,
        populate?: boolean
    ): Promise<T> {
        const user = this.userModel.findOne(find).select('-__v');

        if (populate) {
            user.populate({
                path: 'role',
                match: { isActive: true },
                model: RoleEntity.name,
                select: '-__v',
                populate: {
                    path: 'permissions',
                    match: { isActive: true },
                    model: PermissionEntity.name,
                    select: '-__v'
                }
            });
        }

        return user.lean();
    }

    async create(data: Record<string, any>): Promise<UserDocument> {
        const salt: string = await this.hashService.randomSalt();
        const passwordHash = await this.hashService.hashPassword(
            data.password,
            salt
        );

        const newUser: UserEntity = {
            firstName: data.firstName.toLowerCase(),
            email: data.email.toLowerCase(),
            mobileNumber: data.mobileNumber,
            password: passwordHash,
            role: Types.ObjectId(data.role)
        };

        if (data.lastName) {
            newUser.lastName = data.lastName.toLowerCase();
        }

        const create: UserDocument = new this.userModel(newUser);
        return create.save();
    }

    async deleteOneById(userId: string): Promise<boolean> {
        try {
            this.userModel.deleteOne({
                _id: userId
            });
            return true;
        } catch (e: unknown) {
            return false;
        }
    }

    async updateOneById(
        userId: string,
        data: Record<string, any>
    ): Promise<UserDocument> {
        return this.userModel.updateOne(
            {
                _id: userId
            },
            {
                firstName: data.firstName.toLowerCase(),
                lastName: data.lastName.toLowerCase()
            }
        );
    }

    async checkExist(
        email: string,
        mobileNumber: string,
        userId?: string
    ): Promise<IErrors[]> {
        const existEmail: UserDocument = await this.userModel
            .findOne({
                email: email
            })
            .where('_id')
            .ne(userId)
            .lean();

        const existMobileNumber: UserDocument = await this.userModel
            .findOne({
                mobileNumber: mobileNumber
            })
            .where('_id')
            .ne(userId)
            .lean();

        const errors: IErrors[] = [];
        if (existEmail) {
            errors.push({
                message: this.messageService.get('user.error.emailExist'),
                property: 'email'
            });
        }
        if (existMobileNumber) {
            errors.push({
                message: this.messageService.get(
                    'user.error.mobileNumberExist'
                ),
                property: 'mobileNumber'
            });
        }

        return errors;
    }

    // For migration
    async deleteMany(find?: Record<string, any>): Promise<boolean> {
        try {
            await this.userModel.deleteMany(find);
            return true;
        } catch (e: unknown) {
            return false;
        }
    }
}
