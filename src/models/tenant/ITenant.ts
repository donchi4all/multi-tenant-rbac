import { RoleInterface, RoleType } from "../role/IRole";

export interface TenantInterface {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: RoleType[];
}

export type TenantCreationType = Pick<
  TenantInterface,
  'name' | 'description' | 'isActive'
>;

export type TenantCreationRequestType = Pick<
  TenantInterface,
  'name' | 'description' | 'isActive'
>

export type TenantUpdatedRequestType = {
  name?: string;
  description?: string;
  isActive?: boolean;
}