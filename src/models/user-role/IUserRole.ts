import {Permission} from '../permission';

export interface UserRoleInterface {
  id?: number;
  userId: string;
  tenantId: number;
  roleId: number;
  status: `${UserRoleStatus}`;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?:Permission[]
}

export enum UserRoleStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export type UserRoleCreationType = Pick<UserRoleInterface, 'userId'|'tenantId'> & {role: string}