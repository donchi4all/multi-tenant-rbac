import { RoleService } from './services/role';
import { TenantService, TenantInterface } from './services/tenant';
import Database, { MongodbConfig, rbacConfig } from './modules/database';
import { PermissionService } from './services/permission';

export type TenantCreationType = Pick<
    TenantInterface,
    'name' | 'description' | 'isActive'
>;

class MultiTenantRBAC {
    constructor(private config: rbacConfig) {
        this.init(config);
    }

    public clearConsole(): void {
        process.stdout.write('\x1B[2J\x1B[0f');
    }

    public init(config: rbacConfig): void {
        Database.init(config);
    }
}



// This can live anywhere in your codebase:
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


// Then you create an interface which merges
// the expected mixins with the same name as your base
interface MultiTenantRBAC extends TenantService, RoleService, PermissionService { }
// Apply the mixins into the base class via
// the JS at runtime
applyMixins(MultiTenantRBAC, [TenantService, RoleService, PermissionService]);


export default MultiTenantRBAC;
export { RoleService, TenantService, Database, MongodbConfig, rbacConfig };
