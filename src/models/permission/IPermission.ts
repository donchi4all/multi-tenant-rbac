export interface PermissionInterface {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date,
  updatedAt?: Date;
}

export type PermissionCreationType = Pick<
  PermissionInterface,
  'title' | 'slug' | 'description' | 'isActive'
>;

export type PermissionCreationRequestType = Pick<
  PermissionInterface,
  'title' | 'description' | 'isActive'
>;

export type PermissionEditRequestType = PermissionCreationRequestType;
