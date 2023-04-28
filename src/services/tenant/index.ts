import { ITenantService } from './ITenantService';
import {
  TenantCreationType,
  TenantInterface,
} from '../../models/tenant/ITenant';
import roleService from '../../services/role';
import {
  Tenant,
  UserRole,
  Permission,
  Role,
  RolePermission,
} from '../../models';
import { Op } from 'sequelize';
import {
  TenantErrorHandler,
  UserRoleErrorHandler,
  CommonErrorHandler,
} from '../../modules/exceptions';
import {
  UserRoleCreationType,
  UserRoleInterface,
  UserRoleStatus,
} from '../../models/user-role/IUserRole';
import { PermissionInterface } from '../../models/permission/IPermission';

export {
  TenantInterface,
  TenantCreationType,
  UserRoleCreationType,
};
export type UserHasPermissionRequest = {
  tenantId: UserRoleInterface['tenantId'];
  userId: UserRoleInterface['userId'];
  permissionId: PermissionInterface['id'] | PermissionInterface['id'][];
};

export type UserRoleResponse = {
  userId: string | number;
  roles: Array<Record<string, any>>;
};

export type UserPermissionResponse = {
  userId: string | number;
  permissions: Array<Record<string, any>>;
};

export type UserRoleSyncType = {
  tenantId: TenantInterface['id'];
  userId: UserRoleInterface['userId'];
  role: string | string[];
};

export type userHasPermission = {
  userId: UserRoleInterface['userId'];
  permission: PermissionInterface['title'];
};

export class TenantService implements ITenantService {
  /**
   * Find tenant
   * @param value
   * @param rejectIfNotFound
   */
  public async findTenant(
    value: string,
    rejectIfNotFound: boolean = true
  ): Promise<Tenant> {
    try {
      const tenant = await Tenant.findOne({
        where: {
          [Op.or]: [{ slug: value }, { name: value }],
        },
      });

      if (!tenant && rejectIfNotFound) {
        return Promise.reject(
          new TenantErrorHandler(TenantErrorHandler.DoesNotExist)
        );
      }
      return tenant;
    } catch (err) {
      throw new TenantErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  /**
   * Find tenant by Id
   * @param tenantId
   * @param rejectIfNotFound
   */
  async findTenantById(
    tenantId: TenantInterface['id'],
    rejectIfNotFound: boolean = true
  ): Promise<Tenant> {
    try {
      const tenant = await Tenant.findOne({
        where: {
          id: tenantId
        }
      });

      if (!tenant && rejectIfNotFound) {
        return Promise.reject(
          new TenantErrorHandler(TenantErrorHandler.DoesNotExist)
        );
      }
      return tenant;
    } catch (err) {
      throw new TenantErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  /**
   * Create Tenant in a platform
   * @param tenantData
   * @param returnIfFound
   */
  public async createTenant(
    tenantData: TenantCreationType,
    returnIfFound: boolean = true
  ): Promise<TenantInterface> {
    try {
      const existingPlatform = await this.findTenant(
        tenantData.name,
        false
      );
      if (existingPlatform) {
        if (returnIfFound) return existingPlatform;
        throw new TenantErrorHandler(TenantErrorHandler.AlreadyExists);
      }
      const [name, slug] = Array(2).fill(tenantData.name);

      const tenant = await Tenant.create({
        ...tenantData,
        name,
        slug
      });
      return tenant.get();
    } catch (err) {
      throw err;
    }

  }

  /**
   *
   * @param slug
   */
  public async deleteTenant(
    slug: TenantInterface['slug'],
  ): Promise<TenantInterface> {
    const tenant = await this.findTenant(slug);
    if (!tenant.isActive) {
      throw new TenantErrorHandler(TenantErrorHandler.Forbidden);
    }
    await tenant.destroy();
    return tenant.get();
  }

  /**
   * Find Tenant in a platform
   * @param slug
   */
  public async getTenant(
    slug: TenantInterface['slug'],
  ): Promise<TenantInterface> {
    return await this.findTenant(slug);
  }


  /**
   * update tenant data
   * @param tenantData
   * @param _slug
   */
  public async updateTenant(
    tenantData: TenantCreationType,
    _slug: TenantInterface['slug'],
  ): Promise<TenantInterface> {
    const tenant = await this.findTenant(_slug, false);
    if (!tenant) {
      throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
    }

    const [name, slug] = Array(2).fill(tenantData.name);
    await tenant.update({
      ...tenantData,
      name,
      slug,
    });
    return tenant.get();
  }

  /**
   * Get Tenant User With Role
   *
   * @param _slug
   */
  public async getTenantWithRoleAndPermissions(
    _slug: TenantInterface['slug']
  ): Promise<unknown> {
    const tenant = await this.findTenant(_slug);

    return await Tenant.findAll({
      where: { id: tenant.id },
      include: [
        {
          model: UserRole,
          attributes: ['id', 'userId', 'status', 'createdAt'],
          include: [
            {
              model: Role,
              attributes: ['title', 'slug', 'isActive', 'description'],
              include: [
                {
                  model: RolePermission,
                  attributes: ['id'],
                  include: [
                    {
                      model: Permission,
                      attributes: [
                        'title',
                        'isActive',
                        'description',
                        'createdAt',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  /**
   * Assign role to Tenant User
   *
   * @param tenantUserRoleData
   */
  public async assignRoleToTenantUser(
    tenantUserRoleData: UserRoleCreationType
  ): Promise<UserRoleInterface> {
    const { userId, role, tenantId } = tenantUserRoleData;
    const tenant = await this.findTenantById(tenantId);

    //check if this role belong to this tenant
    const foundRole = await roleService.findRole(tenant.id, role);
    const tenantUserRole = await this.findUserRole(
      tenant.id,
      userId,
      foundRole.id,
      false
    );

    if (tenantUserRole) {
      return Promise.reject(
        new UserRoleErrorHandler(
          UserRoleErrorHandler.AlreadyExists
        )
      );
    }

    try {
      const status = UserRoleStatus.ACTIVE;
      return await UserRole.create({
        userId,
        roleId: foundRole.id,
        status,
        tenantId: tenant.id,
      });
    } catch (err) {
      throw new UserRoleErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  /**
   * Finds an existing tenant user record
   *
   * @param tenantId
   * @param userId
   * @param roleId
   * @param rejectIfNotFound
   */
  async findUserRole(
    tenantId: TenantInterface['id'],
    userId: UserRoleInterface['userId'],
    roleId: UserRoleInterface['roleId'],
    rejectIfNotFound: boolean = true
  ): Promise<UserRole> {
    const tenantUserRole = await UserRole.findOne({
      where: { tenantId, userId, roleId },
      include: [
        {
          model: Tenant,
          attributes: ['name', 'slug', 'description'],
        },
      ],
    });

    if (!tenantUserRole && rejectIfNotFound) {
      return Promise.reject(
        new UserRoleErrorHandler(
          UserRoleErrorHandler.DoesNotExist
        )
      );
    }
    return tenantUserRole;
  }

  /**
   * Get tenant user roles
   * @param tenantId
   * @param userId
   * @param rejectIfNotFound
   */
  public async getUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    rejectIfNotFound: boolean = true
  ): Promise<UserRoleResponse> {
    const tenant = await this.findTenantById(tenantId);
    const tenantUserRole = await UserRole.findAll({
      where: { tenantId: tenant.id, userId },
      include: [
        {
          model: Role,
          attributes: ['id', 'title', 'slug', 'isActive', 'description'],
        },
      ],
    });

    if (!tenantUserRole && rejectIfNotFound) {
      return Promise.reject(
        new UserRoleErrorHandler(
          UserRoleErrorHandler.DoesNotExist
        )
      );
    }

    const roles = tenantUserRole.reduce(
      (result: Array<Record<string, any>>, privilege: UserRole) => {
        if (privilege.role) {
          result.push({
            id: privilege?.role?.id,
            title: privilege?.role?.title,
            slug: privilege?.role?.slug,
            description: privilege?.role?.description,
          });
        }

        return result;
      },
      []
    );

    return {
      userId: userId,
      roles,
    };
  }

  /**
   * Get tenant user permission
   * @param tenantId
   * @param userId
   * @param rejectIfNotFound
   */
  public async getTenantUserPermissions(
    platformId: string,
    tenantId: string,
    userId: string | number,
    rejectIfNotFound: boolean = true
  ): Promise<UserPermissionResponse> {
    const tenant = await this.findTenant(tenantId);
    const tenantUserRole = await UserRole.findAll({
      where: { tenantId: tenant.id, userId },
      include: [
        {
          model: Permission,
          attributes: ['id', 'title', 'slug', 'description'],
        },
      ],
    });
    if (!tenantUserRole && rejectIfNotFound) {
      return Promise.reject(
        new UserRoleErrorHandler(
          UserRoleErrorHandler.DoesNotExist
        )
      );
    }
    const permissions = tenantUserRole.reduce((result: any, role: any) => {
      role.permissions.forEach(
        (permission: any) => delete permission.dataValues.RolePermission
      );

      result = [...result, ...role.permissions];

      return result;
    }, []);

    const uniquePermissions = [
      ...new Map(
        permissions.map((item: { [x: string]: any }) => [item['title'], item])
      ).values(),
    ];

    return {
      userId: userId,
      permissions: uniquePermissions,
    };
  }

  /**
   * Get tenant user role and permission
   * @param tenantId
   * @param userId
   * @param rejectIfNotFound
   */
  public async getUserRolesAndPermissions(
    tenantId: string | number,
    userId: string | number,
    rejectIfNotFound: boolean = true
  ): Promise<UserRoleResponse> {
    const tenantUserRole = await UserRole.findAll({
      where: { tenantId, userId },
      include: [
        {
          model: Role,
          attributes: ['title', 'slug', 'isActive', 'description'],
          include: [
            {
              model: Permission,
              attributes: ['title', 'slug', 'description'],
            },
          ],
        },
      ],
    });

    if (!tenantUserRole && rejectIfNotFound) {
      return Promise.reject(
        new UserRoleErrorHandler(
          UserRoleErrorHandler.DoesNotExist
        )
      );
    }

    const roleAndPermissions = tenantUserRole.map(
      (rolePermission: UserRole) => {
        rolePermission.role?.permission?.forEach(
          (permission: any) => delete permission.dataValues.RolePermission
        );

        return {
          title: rolePermission.role.title,
          slug: rolePermission.role.slug,
          description: rolePermission.role.description,
          permissions: rolePermission.role.permission,
        };
      }
    );

    return {
      userId: userId,
      roles: roleAndPermissions,
    };
  }

  /**
   *  Get user with it's permissions
   * @param userId
   * @param permission
   */
  public async userPermissions(payload: userHasPermission): Promise<boolean> {
    const { userId, permission } = payload;
    const userPermissions = await UserRole.findOne({
      where: { userId: userId },
      include: [
        {
          model: Permission,
          where: { title: permission },
        },
      ],
    });
    return (userPermissions && true) || false;
  }

  public async syncUserWithRole(
    payload: UserRoleSyncType
  ): Promise<unknown> {

    if (!Array.isArray(payload['role'])) {
      payload['role'] = [payload['role']];
    }
    const { tenantId, userId, role } = payload;

    try {
      const tenant = await this.findTenantById(tenantId);
      //remove all the current role a user has
      await UserRole.destroy({
        where: { tenantId: tenant.id, userId },
      });

      const roles = await roleService.findRoles(tenant.id, role);

      const records: any[] = roles.map((role) => {
        return {
          userId,
          roleId: role.id,
          status: 'active',
          tenantId: tenant.id,
        };
      });

      return await UserRole.bulkCreate([...records]);
    } catch (e) {
      throw e;
    }
  }

  public async findTenantUserByRole(
    tenantId: UserRoleInterface['tenantId'],
    roleSlug: string
  ): Promise<Array<UserRoleInterface>> {
    const tenant = await this.findTenantById(tenantId);
    const role = await roleService.findRoleByName(tenant.id, roleSlug);
    const users = await UserRole.findAll({
      where: { tenantId: tenant.id, roleId: role.id, status: 'active' },
    });
    return users;
  }
}

const tenantService = new TenantService();
export default tenantService;
