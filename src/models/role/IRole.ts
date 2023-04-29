export interface RoleInterface {
  id?: number;
  tenantId: number;
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleCreationType = Pick<RoleInterface, 'tenantId' | 'title' | 'slug' | 'description' | 'isActive'>;

export type RoleCreationRequestType = Pick<RoleInterface, 'title' | 'description' | 'isActive'>;

export type RoleEditRequestType = RoleCreationRequestType;
