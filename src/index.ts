import { RoleService } from './services/role';
import { TenantService, TenantInterface } from './services/tenant';
import Database from './modules/database';
import { PermissionService } from './services/permission';
import {
  DynamicAuthorizePayload,
  DynamicBulkRolePayload,
  DynamicFindUserByRolePayload,
  DynamicUserPermissionResponse,
  DynamicUserHasPermissionPayload,
  DynamicUserRoleCreate,
  DynamicUserRoleQuery,
  DynamicUserRoleResponse,
  DynamicUserRoleRevoke,
  IRbacAdapter,
  MongodbConfig,
  PostgresConfig,
  RbacKeysConfig,
  ResolveRbacKeys,
  ResolveRbacModels,
  RbacModelsConfig,
  SequelizeConfig,
  rbacConfig,
  resolveRbacConfig,
} from './core/types';
import InMemoryAdapter from './adapters/memory';
import SequelizeAdapter from './adapters/sequelize';
import LegacySequelizeAdapter from './adapters/legacy/sequelize';
import LegacyMongooseAdapter from './adapters/legacy/mongoose';
import AuditTrail from './modules/audit';
import hooks from './modules/hooks';
import { ValidationError } from './modules/validation';

export type TenantCreationType = Pick<
  TenantInterface,
  'name' | 'description' | 'isActive'
>;

class MultiTenantRBAC {
  constructor(private config: rbacConfig) {
    this.init(config);
  }

  public init(config: rbacConfig): void {
    try {
      // If already initialized externally (recommended path), avoid re-initializing in background.
      Database.getConfig();
      return;
    } catch (_error) {
      void Database.init(config);
    }
  }
}

function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}

interface MultiTenantRBAC extends TenantService, RoleService, PermissionService {}

applyMixins(MultiTenantRBAC, [TenantService, RoleService, PermissionService]);

type OverridableTypedMethods =
  | 'assignRoleToUser'
  | 'getUserRole'
  | 'getUserPermissions'
  | 'getUserRolesAndPermissions'
  | 'revokeRoleFromUser'
  | 'listEffectivePermissions'
  | 'authorize'
  | 'assignRolesToUserBulk'
  | 'syncUserRoles'
  | 'findUserByRole'
  | 'userHasPermission';

export type TypedRbacMethods<K extends RbacKeysConfig> = {
  assignRoleToUser(
    payload: DynamicUserRoleCreate<K>
  ): ReturnType<MultiTenantRBAC['assignRoleToUser']>;
  getUserRole(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserRoleResponse<K>>;
  getUserRole(
    tenantId: Parameters<MultiTenantRBAC['getUserRole']>[0],
    userId: Parameters<MultiTenantRBAC['getUserRole']>[1],
    rejectIfNotFound?: Parameters<MultiTenantRBAC['getUserRole']>[2]
  ): ReturnType<MultiTenantRBAC['getUserRole']>;
  getUserPermissions(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserPermissionResponse<K>>;
  getUserPermissions(
    tenantId: Parameters<MultiTenantRBAC['getUserPermissions']>[0],
    userId: Parameters<MultiTenantRBAC['getUserPermissions']>[1]
  ): ReturnType<MultiTenantRBAC['getUserPermissions']>;
  getUserRolesAndPermissions(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserRoleResponse<K>>;
  getUserRolesAndPermissions(
    tenantId: Parameters<MultiTenantRBAC['getUserRolesAndPermissions']>[0],
    userId: Parameters<MultiTenantRBAC['getUserRolesAndPermissions']>[1],
    rejectIfNotFound?: Parameters<MultiTenantRBAC['getUserRolesAndPermissions']>[2]
  ): ReturnType<MultiTenantRBAC['getUserRolesAndPermissions']>;
  revokeRoleFromUser(payload: DynamicUserRoleRevoke<K>): ReturnType<MultiTenantRBAC['revokeRoleFromUser']>;
  revokeRoleFromUser(
    tenantId: Parameters<MultiTenantRBAC['revokeRoleFromUser']>[0],
    userId: Parameters<MultiTenantRBAC['revokeRoleFromUser']>[1],
    roleSlug: Parameters<MultiTenantRBAC['revokeRoleFromUser']>[2]
  ): ReturnType<MultiTenantRBAC['revokeRoleFromUser']>;
  listEffectivePermissions(
    payload: Omit<DynamicUserRoleQuery<K>, 'rejectIfNotFound'>
  ): ReturnType<MultiTenantRBAC['listEffectivePermissions']>;
  listEffectivePermissions(
    tenantId: Parameters<MultiTenantRBAC['listEffectivePermissions']>[0],
    userId: Parameters<MultiTenantRBAC['listEffectivePermissions']>[1]
  ): ReturnType<MultiTenantRBAC['listEffectivePermissions']>;
  authorize(payload: DynamicAuthorizePayload<K>): ReturnType<MultiTenantRBAC['authorize']>;
  authorize(
    tenantId: Parameters<MultiTenantRBAC['authorize']>[0],
    userId: Parameters<MultiTenantRBAC['authorize']>[1],
    permission: Parameters<MultiTenantRBAC['authorize']>[2]
  ): ReturnType<MultiTenantRBAC['authorize']>;
  assignRolesToUserBulk(payload: DynamicBulkRolePayload<K>): ReturnType<MultiTenantRBAC['assignRolesToUserBulk']>;
  assignRolesToUserBulk(
    tenantId: Parameters<MultiTenantRBAC['assignRolesToUserBulk']>[0],
    userId: Parameters<MultiTenantRBAC['assignRolesToUserBulk']>[1],
    roleSlugs: Parameters<MultiTenantRBAC['assignRolesToUserBulk']>[2]
  ): ReturnType<MultiTenantRBAC['assignRolesToUserBulk']>;
  syncUserRoles(payload: DynamicBulkRolePayload<K>): ReturnType<MultiTenantRBAC['syncUserRoles']>;
  syncUserRoles(
    tenantId: Parameters<MultiTenantRBAC['syncUserRoles']>[0],
    userId: Parameters<MultiTenantRBAC['syncUserRoles']>[1],
    roleSlugs: Parameters<MultiTenantRBAC['syncUserRoles']>[2]
  ): ReturnType<MultiTenantRBAC['syncUserRoles']>;
  findUserByRole(payload: DynamicFindUserByRolePayload<K>): ReturnType<MultiTenantRBAC['findUserByRole']>;
  findUserByRole(
    tenantId: Parameters<MultiTenantRBAC['findUserByRole']>[0],
    roleSlug: Parameters<MultiTenantRBAC['findUserByRole']>[1]
  ): ReturnType<MultiTenantRBAC['findUserByRole']>;
  userHasPermission(payload: DynamicUserHasPermissionPayload<K>): ReturnType<MultiTenantRBAC['userHasPermission']>;
  userHasPermission(payload: Parameters<MultiTenantRBAC['userHasPermission']>[0]): ReturnType<MultiTenantRBAC['userHasPermission']>;
};

export type TypedRbacAdvancedAliases<K extends RbacKeysConfig> = {
  assignRoleToUserAdvanced(payload: DynamicUserRoleCreate<K>): ReturnType<MultiTenantRBAC['assignRoleToUser']>;
  getUserRoleAdvanced(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserRoleResponse<K>>;
  getUserPermissionsAdvanced(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserPermissionResponse<K>>;
  getUserRolesAndPermissionsAdvanced(payload: DynamicUserRoleQuery<K>): Promise<DynamicUserRoleResponse<K>>;
  revokeRoleFromUserAdvanced(payload: DynamicUserRoleRevoke<K>): ReturnType<MultiTenantRBAC['revokeRoleFromUser']>;
  listEffectivePermissionsAdvanced(
    payload: Omit<DynamicUserRoleQuery<K>, 'rejectIfNotFound'>
  ): ReturnType<MultiTenantRBAC['listEffectivePermissions']>;
  authorizeAdvanced(payload: DynamicAuthorizePayload<K>): ReturnType<MultiTenantRBAC['authorize']>;
  assignRolesToUserBulkAdvanced(payload: DynamicBulkRolePayload<K>): ReturnType<MultiTenantRBAC['assignRolesToUserBulk']>;
  syncUserRolesAdvanced(payload: DynamicBulkRolePayload<K>): ReturnType<MultiTenantRBAC['syncUserRoles']>;
  findUserByRoleAdvanced(payload: DynamicFindUserByRolePayload<K>): ReturnType<MultiTenantRBAC['findUserByRole']>;
  userHasPermissionAdvanced(payload: DynamicUserHasPermissionPayload<K>): ReturnType<MultiTenantRBAC['userHasPermission']>;
};

export type TypedMultiTenantRBAC<
  M extends RbacModelsConfig = RbacModelsConfig,
  K extends RbacKeysConfig = RbacKeysConfig,
> = Omit<MultiTenantRBAC, OverridableTypedMethods> &
  TypedRbacMethods<K> &
  TypedRbacAdvancedAliases<K> & {
    readonly typedConfig: {
      models: M;
      keys: K;
    };
  };

function getDynamicValue(
  payload: Record<string, unknown>,
  configuredKey: string,
  fallbackKey: string
): string {
  const value = payload[configuredKey] ?? payload[fallbackKey];
  if (typeof value !== 'string') {
    throw new Error(`Missing "${configuredKey}" (or fallback "${fallbackKey}") in payload.`);
  }
  return value;
}

function getRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing "${key}" in payload.`);
  }
  return value;
}

function isPayloadObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasAnyKey(payload: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => key in payload);
}

export function createTypedRBAC<
  const M extends Partial<RbacModelsConfig> = {},
  const K extends Partial<RbacKeysConfig> = {},
>(
  config: Omit<rbacConfig, 'models' | 'keys'> & {
    models?: M;
    keys?: K;
  }
): TypedMultiTenantRBAC<ResolveRbacModels<M>, ResolveRbacKeys<K>> {
  const resolved = resolveRbacConfig(config as rbacConfig);
  const instance = new MultiTenantRBAC(config as rbacConfig);
  const typedKeys = resolved.keys as ResolveRbacKeys<K>;
  const typedModels = resolved.models as ResolveRbacModels<M>;
  const keys = typedKeys as RbacKeysConfig;
  const base = instance as MultiTenantRBAC;
  const originalAssignRoleToUser = base.assignRoleToUser.bind(base);
  const originalGetUserRole = base.getUserRole.bind(base);
  const originalGetUserPermissions = base.getUserPermissions.bind(base);
  const originalGetUserRolesAndPermissions = base.getUserRolesAndPermissions.bind(base);
  const originalRevokeRoleFromUser = base.revokeRoleFromUser.bind(base);
  const originalListEffectivePermissions = base.listEffectivePermissions.bind(base);
  const originalAuthorize = base.authorize.bind(base);
  const originalAssignRolesToUserBulk = base.assignRolesToUserBulk.bind(base);
  const originalSyncUserRoles = base.syncUserRoles.bind(base);
  const originalFindUserByRole = base.findUserByRole.bind(base);
  const originalUserHasPermission = base.userHasPermission.bind(base);

  const toDynamicUserRoleResponse = (
    result: Awaited<ReturnType<MultiTenantRBAC['getUserRole']>>
  ) =>
    ({
      [keys.userId]: result.userId,
      roles: result.roles,
    }) as DynamicUserRoleResponse<ResolveRbacKeys<K>>;

  const toDynamicUserPermissionResponse = (
    result: Awaited<ReturnType<MultiTenantRBAC['getUserPermissions']>>
  ) =>
    ({
      [keys.userId]: result.userId,
      permissions: result.permissions,
    }) as DynamicUserPermissionResponse<ResolveRbacKeys<K>>;

  const typed = {
    assignRoleToUser(payload: any) {
      const raw = payload as Record<string, unknown>;
      return originalAssignRoleToUser({
        roleSlug: getRequiredString(raw, 'roleSlug'),
        userId: getDynamicValue(raw, keys.userId, 'userId'),
        tenantId: getDynamicValue(raw, keys.tenantId, 'tenantId'),
      });
    },
    async getUserRole(payloadOrTenantId: any, userId?: any, rejectIfNotFound?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        const tenantId = getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId');
        const typedUserId = getDynamicValue(payloadOrTenantId, keys.userId, 'userId');
        const result = await originalGetUserRole(
          tenantId,
          typedUserId,
          payloadOrTenantId.rejectIfNotFound as boolean | undefined
        );
        return toDynamicUserRoleResponse(result);
      }

      return originalGetUserRole(payloadOrTenantId, userId, rejectIfNotFound);
    },
    async getUserPermissions(payloadOrTenantId: any, userId?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        const tenantId = getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId');
        const typedUserId = getDynamicValue(payloadOrTenantId, keys.userId, 'userId');
        const result = await originalGetUserPermissions(tenantId, typedUserId);
        return toDynamicUserPermissionResponse(result);
      }

      return originalGetUserPermissions(payloadOrTenantId, userId as string);
    },
    async getUserRolesAndPermissions(payloadOrTenantId: any, userId?: any, rejectIfNotFound?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        const tenantId = getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId');
        const typedUserId = getDynamicValue(payloadOrTenantId, keys.userId, 'userId');
        const result = await originalGetUserRolesAndPermissions(
          tenantId,
          typedUserId,
          payloadOrTenantId.rejectIfNotFound as boolean | undefined
        );
        return toDynamicUserRoleResponse(result);
      }

      return originalGetUserRolesAndPermissions(payloadOrTenantId, userId as string, rejectIfNotFound);
    },
    revokeRoleFromUser(payloadOrTenantId: any, userId?: any, roleSlug?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalRevokeRoleFromUser(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getDynamicValue(payloadOrTenantId, keys.userId, 'userId'),
          getRequiredString(payloadOrTenantId, 'roleSlug')
        );
      }

      return originalRevokeRoleFromUser(payloadOrTenantId, userId as string, roleSlug as string);
    },
    listEffectivePermissions(payloadOrTenantId: any, userId?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalListEffectivePermissions(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getDynamicValue(payloadOrTenantId, keys.userId, 'userId')
        );
      }

      return originalListEffectivePermissions(payloadOrTenantId, userId as string);
    },
    authorize(payloadOrTenantId: any, userId?: any, permission?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalAuthorize(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getDynamicValue(payloadOrTenantId, keys.userId, 'userId'),
          getRequiredString(payloadOrTenantId, 'permission')
        );
      }

      return originalAuthorize(payloadOrTenantId, userId as string, permission as string);
    },
    assignRolesToUserBulk(payloadOrTenantId: any, userId?: any, roleSlugs?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalAssignRolesToUserBulk(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getDynamicValue(payloadOrTenantId, keys.userId, 'userId'),
          (payloadOrTenantId.roleSlugs as string[]) || []
        );
      }

      return originalAssignRolesToUserBulk(payloadOrTenantId, userId, roleSlugs as string[]);
    },
    syncUserRoles(payloadOrTenantId: any, userId?: any, roleSlugs?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalSyncUserRoles(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getDynamicValue(payloadOrTenantId, keys.userId, 'userId'),
          (payloadOrTenantId.roleSlugs as string[]) || []
        );
      }

      return originalSyncUserRoles(payloadOrTenantId, userId, roleSlugs as string[]);
    },
    findUserByRole(payloadOrTenantId: any, roleSlug?: any) {
      if (isPayloadObject(payloadOrTenantId)) {
        return originalFindUserByRole(
          getDynamicValue(payloadOrTenantId, keys.tenantId, 'tenantId'),
          getRequiredString(payloadOrTenantId, 'roleSlug')
        );
      }

      return originalFindUserByRole(payloadOrTenantId, roleSlug as string);
    },
    userHasPermission(payload: any) {
      const raw = payload as Record<string, unknown>;
      if (isPayloadObject(raw) && !('userId' in raw)) {
        return originalUserHasPermission({
          userId: getDynamicValue(raw, keys.userId, 'userId'),
          tenantId:
            raw[keys.tenantId] !== undefined || raw.tenantId !== undefined
              ? getDynamicValue(raw, keys.tenantId, 'tenantId')
              : undefined,
          permission: getRequiredString(raw, 'permission'),
        });
      }

      return originalUserHasPermission(payload as Parameters<MultiTenantRBAC['userHasPermission']>[0]);
    },
  } as unknown as TypedRbacMethods<ResolveRbacKeys<K>>;

  const advancedAliases: TypedRbacAdvancedAliases<ResolveRbacKeys<K>> = {
    assignRoleToUserAdvanced(payload) {
      return typed.assignRoleToUser(payload);
    },
    async getUserRoleAdvanced(payload) {
      return typed.getUserRole(payload) as Promise<DynamicUserRoleResponse<ResolveRbacKeys<K>>>;
    },
    async getUserPermissionsAdvanced(payload) {
      return typed.getUserPermissions(
        payload
      ) as Promise<DynamicUserPermissionResponse<ResolveRbacKeys<K>>>;
    },
    async getUserRolesAndPermissionsAdvanced(payload) {
      return typed.getUserRolesAndPermissions(
        payload
      ) as Promise<DynamicUserRoleResponse<ResolveRbacKeys<K>>>;
    },
    revokeRoleFromUserAdvanced(payload) {
      return typed.revokeRoleFromUser(payload);
    },
    listEffectivePermissionsAdvanced(payload) {
      return typed.listEffectivePermissions(payload);
    },
    authorizeAdvanced(payload) {
      return typed.authorize(payload);
    },
    assignRolesToUserBulkAdvanced(payload) {
      return typed.assignRolesToUserBulk(payload);
    },
    syncUserRolesAdvanced(payload) {
      return typed.syncUserRoles(payload);
    },
    findUserByRoleAdvanced(payload) {
      return typed.findUserByRole(payload);
    },
    userHasPermissionAdvanced(payload) {
      return typed.userHasPermission(payload);
    },
  };

  return Object.assign(instance, typed, advancedAliases, {
    typedConfig: {
      keys: typedKeys,
      models: typedModels,
    },
  }) as unknown as TypedMultiTenantRBAC<ResolveRbacModels<M>, ResolveRbacKeys<K>>;
}

export default MultiTenantRBAC;
export {
  Database,
  DynamicAuthorizePayload,
  DynamicBulkRolePayload,
  DynamicFindUserByRolePayload,
  DynamicUserPermissionResponse,
  DynamicUserHasPermissionPayload,
  DynamicUserRoleCreate,
  DynamicUserRoleQuery,
  DynamicUserRoleResponse,
  DynamicUserRoleRevoke,
  IRbacAdapter,
  MongodbConfig,
  PostgresConfig,
  RbacKeysConfig,
  ResolveRbacKeys,
  ResolveRbacModels,
  RbacModelsConfig,
  SequelizeConfig,
  rbacConfig,
  RoleService,
  TenantService,
  InMemoryAdapter,
  SequelizeAdapter,
  LegacySequelizeAdapter,
  LegacyMongooseAdapter,
  AuditTrail,
  hooks,
  ValidationError,
};
