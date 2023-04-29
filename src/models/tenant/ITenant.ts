export interface TenantInterface {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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