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
