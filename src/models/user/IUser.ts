import { RoleInterface, RoleType } from "../role/IRole";

export interface UserInterface {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: RoleType[];
}

