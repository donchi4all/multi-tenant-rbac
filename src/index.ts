import { RoleService } from './services/role';
import { TenantService, TenantInterface } from './services/tenant';
import Database from './modules/database';
import { PermissionService } from './services/permission';
import {
  IRbacAdapter,
  MongodbConfig,
  PostgresConfig,
  RbacKeysConfig,
  RbacModelsConfig,
  SequelizeConfig,
  rbacConfig,
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
    void Database.init(config);
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

export default MultiTenantRBAC;
export {
  Database,
  IRbacAdapter,
  MongodbConfig,
  PostgresConfig,
  RbacKeysConfig,
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
