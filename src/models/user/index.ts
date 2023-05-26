import {
  Table,
  AutoIncrement,
  PrimaryKey,
  Column,
  Model,
  DataType,
  UpdatedAt,
  CreatedAt,
  AllowNull,
  Default,
  Unique,
  BelongsTo, HasMany, BelongsToMany,
} from 'sequelize-typescript';
import { StringsFormating as Str } from '../../utils';
import { Permission, Role, RolePermission, UserRole } from '../index';
import { UserInterface } from './IUser';

@Table({
  tableName: 'users',
})
export class User extends Model<UserInterface> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
})
  id!: UserInterface['id'];

  @Column(DataType.STRING)
  name!: UserInterface['name'];

  @Unique
  @Column({
    type: DataType.STRING,
    set(value: string): void {
      this.setDataValue('slug', Str.toSlugCase(value));
    },
  })
  slug!: UserInterface['slug'];

  @HasMany(() => UserRole)
  userRoles!: UserRole[];

  @HasMany(() => Role)
  roles!: Role[];


  @AllowNull
  @Column(DataType.STRING)
  description: UserInterface['description'];

  @Default(false)
  @Column(DataType.BOOLEAN)
  isActive?: UserInterface['isActive'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: UserInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt: UserInterface['updatedAt'];

  // @BelongsToMany(() => Permission, () => RolePermission)
  // permissions?: Permission[];
}

