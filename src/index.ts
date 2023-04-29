import { RoleService } from './services/role';
import { TenantService, TenantInterface } from './services/tenant';
import Database, { MongodbConfig, rbacConfig } from './modules/database';
import { Tenant } from './models';

export type TenantCreationType = Pick<
    TenantInterface,
    'name' | 'description' | 'isActive'
>;

class MultiTenantRBAC {
    // private roleService: RoleService;
    // private tenantService: TenantService;

    constructor(private config: rbacConfig) {
        // this.roleService = new RoleService();
        // this.tenantService = new TenantService();
        this.init(config);
    }

    public clearConsole(): void {
        process.stdout.write('\x1B[2J\x1B[0f');
    }

    public init(config: rbacConfig): void {
        Database.init(config);
    }

    // /**
    //  * -------Tenants-------
    //  */
    // public async createTenant(
    //     tenantData: TenantCreationType,
    //     returnIfFound: boolean = true
    // ): Promise<TenantInterface> {
    //     return await this.tenantService.createTenant(tenantData, returnIfFound);
    // }


    // /**
    //  * FInd Tenant
    //  * @date 29/04/2023 - 08:41:31
    //  *
    //  * @public
    //  * @async
    //  * @param {string} tenantSlug
    //  * @param {boolean} [rejectIfNotFound=true]
    //  * @returns {Promise<Tenant>}
    //  */
    // public async findTenant(
    //     tenantSlug: string,
    //     rejectIfNotFound: boolean = true
    // ): Promise<Tenant> {
    //     return await this.tenantService.findTenant(tenantSlug, rejectIfNotFound);
    // }

    // public async findTenantById(
    //     tenantId: TenantInterface['id'],
    //     rejectIfNotFound: boolean = true
    //   ): Promise<Tenant> {
    //     return await this.tenantService.findTenantById(tenantId, rejectIfNotFound);
    //   }

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
interface MultiTenantRBAC extends TenantService, RoleService { }
// Apply the mixins into the base class via
// the JS at runtime
applyMixins(MultiTenantRBAC, [TenantService, RoleService]);


export default MultiTenantRBAC;
export { RoleService, TenantService, Database, MongodbConfig, rbacConfig };
