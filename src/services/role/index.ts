/* eslint-disable prefer-const */
import { Op, where } from 'sequelize';
import {
  Tenant,
  UserRole,
  Permission,
  Role,
  RolePermission,
} from '../../models';
import {
  RoleCreationRequestType,
  RoleCreationType,
  RoleEditRequestType,
  RoleInterface,
} from '../../models/role/IRole';
import { IRoleService } from './IRoleService';
import {
  TenantErrorHandler,
  CommonErrorHandler,
  RoleErrorHandler,
  RolePermissionErrorHandler,
} from '../../modules/exceptions';
import {
  AddPermissionToRoleType,
  RolePermissionCreationType,
  RolePermissionInterface,
} from '../../models/role-permission/IRolePermission';
import tenantService, { UserRoleCreationType } from '../tenant';
import { UserRoleRequestType } from '../../models/user-role/IUserRole';
import { StringsFormating as Str } from '../../utils';


export { RolePermissionInterface };

export class RoleService implements IRoleService {
  /**
   * Creates a new role
   *
   * @param payload
   * @returns
   */

  public async createRole(
    tenantSlug: string,
    payload: RoleCreationRequestType | RoleCreationRequestType[],
    formatSlug: boolean = true
  ): Promise<RoleInterface[]> {
    try {
      if (!Array.isArray(payload)) {
        payload = [payload];
      }
      const tenant = await tenantService.findTenant(
        tenantSlug,
        false
      );
      if (!tenant) {
        throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
      }
      const tenantId = tenant.id;
      const roles = await Promise.all(
        payload.map(async ({ description, isActive, ...payload }) => {
          let [title, slug] = Array(2).fill(payload.title);

          if (formatSlug) slug = Str.toSlugCase(slug);
          const [role, created] = await Role.findOrCreate({
            where: { tenantId, slug, title },
            defaults: {
              title,
              slug,
              description,
              isActive,
              tenantId,
            },
          });
          return role.get({ plain: true }) as RoleInterface;
        })
      );
      return roles;
    } catch (err) {
      throw err;
    }
  }


  /**
   * Sudo Implementation for model findOrCreateRole (WIP)
   *
   * @param searchParams
   * @param payload
   * @returns
   */
  public async findOrCreateRole(searchParams: Array<string>, payload: RoleCreationType): Promise<Role> {
    const search = searchParams.reduce((result, param) => {
      result[param] = param;
      return result;
    }, {} as { [key: string]: string });

    try {
      const role = await Role.findOne({ where: { [Op.or]: search } });
      if (role) {
        return role;
      } else {
        return await Role.create(payload);
      }
    } catch (err) {
      throw err;
    }
  }


  /**
   * Update an existing worklfow
   *
   * @param roleId
   * @param payload
   * @returns
   */
  public async updateRole(
    tenantId: string,
    roleId: RoleInterface['id'],
    payload: RoleEditRequestType,
    formatSlug: boolean = true
  ): Promise<Role> {
    try {
      const role = await Role.findOne({
        where: { id: roleId, tenantId },
      });

      if (!role) {
        return Promise.reject(new RoleErrorHandler(RoleErrorHandler.NotExist));
      }

      let [title, slug] = Array(2).fill(payload.title || role.title);

      if (formatSlug) slug = Str.toSlugCase(slug);
      await role.update({ ...role, ...payload, title, slug });

      return role;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Fetch list of roles
   * @tenantId
   * @returns
   */
  public async listRoles(
    tenantId: RoleInterface['tenantId']
  ): Promise<Array<Role>> {
    const tenant = await tenantService.findTenantById(
      tenantId,
      false
    );
    if (!tenant) {
      return Promise.reject(
        new TenantErrorHandler(TenantErrorHandler.DoesNotExist)
      );
    }

    try {
      return await Role.findAll({
        where: { tenantId: tenant.id },
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Find an existing role
   *
   * @param identifier
   * @returns
   */
  public async findRole(
    tenantId: RoleInterface['tenantId'],
    identifier: string
  ): Promise<Role> {
    try {
      const role = await Role.findOne({
        where: {
          [Op.or]: [
            { slug: identifier },
            { title: identifier },
          ],
          [Op.and]: [{ tenantId }],
        },
        include: Tenant,
      });

      if (!role) {
        return Promise.reject(new RoleErrorHandler(RoleErrorHandler.NotExist));
      }

      return role;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Delete an existing role
   *
   * @param roleId
   * @returns
   */
  public async deleteRole(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id']
  ): Promise<void> {
    try {
      const role = await this.findRoleById(tenantId, roleId);
      await role.destroy();

      return;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Find Role By ID
   *
   * @param tenantId
   * @param roleId
   * @param rejectIfNotFound
   */
  public async findRoleById(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id'],
    rejectIfNotFound = true,
  ): Promise<Role> {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          tenantId: tenantId,
        },
        include: [Tenant],
      });

      if (!role && rejectIfNotFound) {
        throw new RoleErrorHandler(RoleErrorHandler.RoleDoNotExist);
      }

      return role!;
    } catch (err) {
      throw new RoleErrorHandler(CommonErrorHandler.Fatal);
    }
  }


  /**
   * Sync Role with permission
   *
   * @param tenantId
   * @param options
   */
  public async addRoleWithPermissions(
    tenantId: RoleInterface['tenantId'],
    options: AddPermissionToRoleType
  ): Promise<Array<RolePermissionInterface>> {
    try {
      let { role, permissions } = options;
      const tenant = await tenantService.findTenantById(
        tenantId
      );
      const getRole = await this.findRole(tenant.id, role);
      const roleId = getRole.id;
      if (!Array.isArray(permissions)) {
        permissions = [permissions];
      }

      const permissionIds = await Permission.findAll({
        where: {
          [Op.or]: [{ slug: { [Op.in]: permissions } }],
          [Op.or]: [{ title: { [Op.in]: permissions } }],
        },
        attributes: ['id'],
      });

      const bulkInsert = permissionIds.reduce(
        (result: any, permission: Permission) => {
          result.push({ roleId, permissionId: permission.id });
          return result;
        },
        []
      );

      return await RolePermission.bulkCreate(bulkInsert);
    } catch (error) {
      throw error;
    }
  }

  public async syncRoleWithPermissions(
    tenantId: RoleInterface['tenantId'],
    options: AddPermissionToRoleType
  ): Promise<Array<RolePermissionInterface>> {
    try {
      const getRole = await this.findRole(tenantId, options['role']);
      const roleId = getRole.id;
      await RolePermission.destroy({ where: { roleId: roleId } });
      return await this.addRoleWithPermissions(tenantId, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find Role with Permission
   *
   * @param roleId
   * @param permissionId
   * @param rejectIfNotFound
   */
  async findRolePermission(
    roleId: RolePermissionInterface['roleId'],
    permissionId: RolePermissionInterface['permissionId'],
    rejectIfNotFound: boolean = true
  ): Promise<RolePermission> {
    try {
      const rolePermission = await RolePermission.findOne({
        where: { roleId, permissionId },
      });

      if (!rolePermission && rejectIfNotFound) {
        throw new RolePermissionErrorHandler(RolePermissionErrorHandler.DoesNotExist);
      }

      return rolePermission!;
    } catch (e) {
      throw new RolePermissionErrorHandler(CommonErrorHandler.Fatal);
    }
  }


  /**
   * Tenant User Role Checker
   * @param payload
   */
  public async userHasRole(
    payload: UserRoleRequestType
  ): Promise<boolean> {
    const userRole = await UserRole.findOne({ where: payload });
    if (!userRole) return Promise.resolve(false);
    return Promise.resolve(true);
  }

  /**
   * Check if Role has  a particular Permission
   * @param payload
   */
  public async roleHasPermission(
    payload: RolePermissionCreationType
  ): Promise<boolean> {
    const rolePermission = await RolePermission.findOne({ where: payload });
    if (!rolePermission) return Promise.resolve(false);
    return Promise.resolve(true);
  }

  /**
   * Find Role By By Property name
   *
   * @param tenantId
   * @param identifier
   * @param rejectIfNotFound
   */
  public async findRoleByName(
    tenantId: RoleInterface['tenantId'],
    identifier: string,
    rejectIfNotFound = true
  ): Promise<Role> {
    try {
      const role = await Role.findOne({
        where: {
          [Op.and]: [
            { tenantId },
            {
              [Op.or]: [
                { slug: identifier },
                { title: identifier },
              ],
            },
          ],
        },
      });

      if (!role && rejectIfNotFound) {
        throw new RoleErrorHandler(RoleErrorHandler.RoleDoNotExist);
      }

      return role!;
    } catch (err) {
      throw new RoleErrorHandler(CommonErrorHandler.Fatal);
    }
  }


  public async findRoles(
    tenantId: RoleInterface['tenantId'],
    identifiers: string[]
  ): Promise<Array<Role>> {
    try {
      const roles = await Role.findAll({
        where: {
          slug: { [Op.or]: identifiers },
          title: { [Op.or]: identifiers },
          [Op.and]: [{ tenantId }],
        },
        include: Tenant,
      });

      if (roles.length < 1) {
        return Promise.reject(new RoleErrorHandler(RoleErrorHandler.NotExist));
      }

      return roles;
    } catch (err) {
      throw err;
    }
  }
}

const roleService = new RoleService();
export default roleService;