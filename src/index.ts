import Database, { rbacConfig } from './modules/database';

import { RoleService } from './services/role';
import { TenantService } from './services/tenant';


// Define a type for the RoleService class methods
type RoleServiceMethod<T extends keyof RoleService> = (
    ...args: Parameters<RoleService[T]>
) => ReturnType<RoleService[T]>;

// Define a type for the RoleService class methods
type TenantServiceMethod<T extends keyof TenantService> = (
    ...args: Parameters<TenantService[T]>
) => ReturnType<TenantService[T]>;


// Define an interface that maps the class method names to their types
interface IRbacService {
    createTenant: TenantServiceMethod<'createTenant'>,
    getTenant: TenantServiceMethod<'findTenant'>,
    updateTenant: TenantServiceMethod<'updateTenant'>,
    findTenantById: TenantServiceMethod<'findTenantById'>,
    deleteTenant: TenantServiceMethod<'deleteTenant'>,
    getTenantWithRoleAndPermissions: TenantServiceMethod<'getTenantWithRoleAndPermissions'>,
    assignRoleToUser: TenantServiceMethod<'assignRoleToTenantUser'>,
    findUserRole: TenantServiceMethod<'findUserRole'>,
    getUserRole: TenantServiceMethod<'getUserRole'>,
    getUserPermissions: TenantServiceMethod<'getTenantUserPermissions'>,
    getUserRolesAndPermissions: TenantServiceMethod<'getUserRolesAndPermissions'>,
    userPermissions: TenantServiceMethod<'userPermissions'>,
    syncUserWithRole: TenantServiceMethod<'syncUserWithRole'>,
    findUserByRole: TenantServiceMethod<'findTenantUserByRole'>,
    createRole: RoleServiceMethod<'createRole'>;
    findOrCreate: RoleServiceMethod<'findOrCreate'>;
    updateRole: RoleServiceMethod<'updateRole'>;
    listRoles: RoleServiceMethod<'listRoles'>;
    findRole: RoleServiceMethod<'findRole'>;
    deleteRole: RoleServiceMethod<'deleteRole'>;
    findRoleById: RoleServiceMethod<'findRoleById'>;

}





// Define an interface that maps the class method names to their types
//   interface IRoleService {
//     createRole: RoleServiceMethod<'createRole'>;
//     findOrCreate: RoleServiceMethod<'findOrCreate'>;
//     updateRole: RoleServiceMethod<'updateRole'>;
//     listRoles: RoleServiceMethod<'listRoles'>;
//     findRole: RoleServiceMethod<'findRole'>;
//     deleteRole: RoleServiceMethod<'deleteRole'>;
//     findRoleById: RoleServiceMethod<'findRoleById'>;
//   }



/** export class MultiTenantRBACD {
    private tenants: ITenantMap = {};

    public addTenant(tenantId: string): void {
        if (!this.tenants[tenantId]) {
            this.tenants[tenantId] = {};
        }
    }

    public removeTenant(tenantId: string): void {
        delete this.tenants[tenantId];
    }

    public addRoleToTenant(roleName: string, tenantId: string): void {
        if (!this.tenants[tenantId][roleName]) {
            this.tenants[tenantId][roleName] = [];
        }
    }

    public removeRoleFromTenant(roleName: string, tenantId: string): void {
        delete this.tenants[tenantId][roleName];
    }

    public addPermissionToRole(permissionName: string, roleName: string, tenantId: string): void {
        if (!this.tenants[tenantId][roleName]) {
            this.tenants[tenantId][roleName] = [];
        }
        if (!this.tenants[tenantId][roleName].some(p => p.permissionName === permissionName)) {
            this.tenants[tenantId][roleName].push({ permissionName });
        }
    }

    public removePermissionFromRole(permissionName: string, roleName: string, tenantId: string): void {
        if (this.tenants[tenantId][roleName]) {
            this.tenants[tenantId][roleName] = this.tenants[tenantId][roleName].filter(p => p.permissionName !== permissionName);
        }
    }

    public checkPermission(userId: string, action: string, tenantId: string): boolean {
        const tenant = this.tenants[tenantId];
        if (!tenant) {
            return false;
        }

        const roles = Object.keys(tenant);
        for (const roleName of roles) {
            const permissions = tenant[roleName];
            if (permissions.some(p => p.permissionName === action)) {
                // The user has the required permission if they belong to the role that has it
                const userRoles = this.getUserRoles(userId, tenantId);
                if (userRoles.includes(roleName)) {
                    return true;
                }
            }
        }

        return false;
    }

    private getUserRoles(userId: string, tenantId: string): string[] {
        // In a real app, this method would fetch the user's roles from a database or API
        // For the sake of simplicity, we're just returning a hardcoded list of roles
        return ['admin'];
    }


}
**/



class MultiTenantRBAC implements IRbacService  {

    private config;
    constructor(config: rbacConfig) {
        this.config = config;
    }
    createTenant: TenantServiceMethod<'createTenant'>;
    getTenant: TenantServiceMethod<'findTenant'>;
    updateTenant: TenantServiceMethod<'updateTenant'>;
    findTenantById: TenantServiceMethod<'findTenantById'>;
    deleteTenant: TenantServiceMethod<'deleteTenant'>;
    getTenantWithRoleAndPermissions: TenantServiceMethod<'getTenantWithRoleAndPermissions'>;
    assignRoleToUser: TenantServiceMethod<'assignRoleToTenantUser'>;
    findUserRole: TenantServiceMethod<'findUserRole'>;
    getUserRole: TenantServiceMethod<'getUserRole'>;
    getUserPermissions: TenantServiceMethod<'getTenantUserPermissions'>;
    getUserRolesAndPermissions: TenantServiceMethod<'getUserRolesAndPermissions'>;
    userPermissions: TenantServiceMethod<'userPermissions'>;
    syncUserWithRole: TenantServiceMethod<'syncUserWithRole'>;
    findUserByRole: TenantServiceMethod<'findTenantUserByRole'>;
    createRole: RoleServiceMethod<'createRole'>;
    findOrCreate: RoleServiceMethod<'findOrCreate'>;
    updateRole: RoleServiceMethod<'updateRole'>;
    listRoles: RoleServiceMethod<'listRoles'>;
    findRole: RoleServiceMethod<'findRole'>;
    deleteRole: RoleServiceMethod<'deleteRole'>;
    findRoleById: RoleServiceMethod<'findRoleById'>;
    public clearConsole(): void {
        process.stdout.write('\x1B[2J\x1B[0f');
    }


    public loadDatabase(config?: rbacConfig): void {
        Database.init(this.config || config);
    }


}

export default MultiTenantRBAC;
export type { IRbacService };
export { RoleService };

