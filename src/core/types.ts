export type ModelName =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'userRoles'
  | 'rolePermissions'
  | 'tenants';

export type RbacModelsConfig = {
  users: string;
  roles: string;
  permissions: string;
  userRoles: string;
  rolePermissions: string;
  tenants: string;
};

export type RbacKeysConfig = {
  userId: string;
  roleId: string;
  permissionId: string;
  tenantId: string;
};

export type ResolveRbacModels<
  T extends Partial<RbacModelsConfig> | undefined = undefined
> = {
  users: T extends { users: infer V extends string } ? V : RbacModelsConfig['users'];
  roles: T extends { roles: infer V extends string } ? V : RbacModelsConfig['roles'];
  permissions: T extends { permissions: infer V extends string }
    ? V
    : RbacModelsConfig['permissions'];
  userRoles: T extends { userRoles: infer V extends string }
    ? V
    : RbacModelsConfig['userRoles'];
  rolePermissions: T extends { rolePermissions: infer V extends string }
    ? V
    : RbacModelsConfig['rolePermissions'];
  tenants: T extends { tenants: infer V extends string } ? V : RbacModelsConfig['tenants'];
};

export type ResolveRbacKeys<
  T extends Partial<RbacKeysConfig> | undefined = undefined
> = {
  userId: T extends { userId: infer V extends string } ? V : RbacKeysConfig['userId'];
  roleId: T extends { roleId: infer V extends string } ? V : RbacKeysConfig['roleId'];
  permissionId: T extends { permissionId: infer V extends string }
    ? V
    : RbacKeysConfig['permissionId'];
  tenantId: T extends { tenantId: infer V extends string } ? V : RbacKeysConfig['tenantId'];
};

export type DynamicUserRef<K extends RbacKeysConfig> = {
  [P in K['userId']]: string;
};

export type DynamicTenantRef<K extends RbacKeysConfig> = {
  [P in K['tenantId']]: string;
};

export type DynamicRoleRef<K extends RbacKeysConfig> = {
  [P in K['roleId']]: string;
};

export type DynamicUserRoleCreate<K extends RbacKeysConfig> = DynamicUserRef<K> &
  DynamicTenantRef<K> & {
    roleSlug: string;
  };

export type DynamicUserRoleQuery<K extends RbacKeysConfig> = DynamicUserRef<K> &
  DynamicTenantRef<K> & {
    rejectIfNotFound?: boolean;
  };

export type DynamicUserRoleRevoke<K extends RbacKeysConfig> = DynamicUserRef<K> &
  DynamicTenantRef<K> & {
    roleSlug: string;
  };

export type DynamicAuthorizePayload<K extends RbacKeysConfig> = DynamicUserRef<K> &
  DynamicTenantRef<K> & {
  permission: string;
};

export type DynamicBulkRolePayload<K extends RbacKeysConfig> = DynamicUserRef<K> &
  DynamicTenantRef<K> & {
    roleSlugs: string[];
  };

export type DynamicFindUserByRolePayload<K extends RbacKeysConfig> = DynamicTenantRef<K> & {
  roleSlug: string;
};

export type DynamicUserHasPermissionPayload<K extends RbacKeysConfig> = DynamicUserRef<K> & {
  permission: string;
} & Partial<DynamicTenantRef<K>>;

export type DynamicUserRoleResponse<K extends RbacKeysConfig> = {
  [P in K['userId']]: string | undefined;
} & {
  roles: Array<Record<string, any>>;
};

export type DynamicUserPermissionResponse<K extends RbacKeysConfig> = {
  [P in K['userId']]: string;
} & {
  permissions: Array<Record<string, any>>;
};

export type MysqlConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export type PostgresConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export type SequelizeConfig = {
  dialect: 'mysql' | 'postgres' | 'mariadb' | 'sqlite' | 'mssql';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  logging?: boolean;
  sync?: boolean;
  syncOptions?: {
    alter?: boolean;
    force?: boolean;
    match?: RegExp;
  };
  autoDefineModels?: boolean;
  sequelize?: any;
  models?: Record<string, any>;
};

export interface MongodbConfig {
  url: string;
  useNewUrlParser: boolean;
  useFindAndModify: boolean;
  useCreateIndex: boolean;
  useUnifiedTopology: boolean;
}

export type AdapterWhere = Record<string, unknown>;

export type AdapterQuery = {
  where?: AdapterWhere;
};

export type AdapterRecord = Record<string, any>;
export type AdapterTransaction = unknown;

export type AdapterTransactionCallback<T> = (
  tx: AdapterTransaction
) => Promise<T>;

export interface IRbacAdapter {
  init?(config: RbacResolvedConfig): Promise<void> | void;
  findOne(model: string, query: AdapterQuery): Promise<AdapterRecord | null>;
  findMany(model: string, query?: AdapterQuery): Promise<AdapterRecord[]>;
  create(model: string, data: AdapterRecord): Promise<AdapterRecord>;
  createMany?(model: string, data: AdapterRecord[]): Promise<AdapterRecord[]>;
  update(
    model: string,
    where: AdapterWhere,
    data: AdapterRecord
  ): Promise<AdapterRecord | null>;
  delete(model: string, where: AdapterWhere): Promise<number>;
  beginTransaction?(): Promise<AdapterTransaction>;
  commitTransaction?(tx: AdapterTransaction): Promise<void>;
  rollbackTransaction?(tx: AdapterTransaction): Promise<void>;
  withTransaction?<T>(callback: AdapterTransactionCallback<T>): Promise<T>;
}

export type rbacConfig = {
  adapter?: IRbacAdapter;
  dialect?: 'mysql' | 'postgres' | 'mongodb';
  mysqlConfig?: MysqlConfig;
  postgresConfig?: PostgresConfig;
  sequelizeConfig?: SequelizeConfig;
  mongodbConfig?: MongodbConfig;
  models?: Partial<RbacModelsConfig>;
  keys?: Partial<RbacKeysConfig>;
};

export type RbacResolvedConfig = Omit<rbacConfig, 'models' | 'keys'> & {
  adapter: IRbacAdapter;
  models: RbacModelsConfig;
  keys: RbacKeysConfig;
};

export const DEFAULT_MODELS: RbacModelsConfig = {
  users: 'users',
  roles: 'roles',
  permissions: 'permissions',
  userRoles: 'user_roles',
  rolePermissions: 'role_permissions',
  tenants: 'tenants',
};

export const DEFAULT_KEYS: RbacKeysConfig = {
  userId: 'userId',
  roleId: 'roleId',
  permissionId: 'permissionId',
  tenantId: 'tenantId',
};

export function resolveRbacConfig(config: rbacConfig): RbacResolvedConfig {
  return {
    ...config,
    adapter: config.adapter as IRbacAdapter,
    models: {
      ...DEFAULT_MODELS,
      ...(config.models || {}),
    },
    keys: {
      ...DEFAULT_KEYS,
      ...(config.keys || {}),
    },
  };
}
