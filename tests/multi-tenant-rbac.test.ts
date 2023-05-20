import MultiTenantRBAC, { rbacConfig } from "../src";

describe('MultiTenantRBAC', () => {
    let RBAC: MultiTenantRBAC;

    beforeAll(() => {
        const config: rbacConfig = {
            dialect: 'mysql',
            mysqlConfig: {
                database: 'lib_rbac1',
                host: '127.0.0.1',
                password: 'password',
                port: 3306,
                username: 'root'
            }
        }
        RBAC = new MultiTenantRBAC(config);
    });

    it('should create a permission', async () => {
        const permission = await RBAC.createPermission([
            {
                isActive: true,
                title: 'read:user',
                description: 'read user information'
            },
            {
                isActive: true,
                title: 'delete:user',
                description: 'delete user information'
            },
            {
                isActive: true,
                title: 'update:user',
                description: 'update user information'
            }
        ]);

        expect(permission).toHaveLength(3);
    });

    it('should create a tenant', async () => {
        const tenant = await RBAC.createTenant({
            name: 'name',
            description: 'description',
            isActive: true
        });

        expect(tenant).toHaveProperty('id');
    });

    it('should create a role for a tenant', async () => {
        const tenant = await RBAC.createTenant({
            name: 'name',
            description: 'description',
            isActive: true
        });

        const role = await RBAC.createRole(tenant.slug, {
            title: 'initiator1',
            isActive: true,
            description: 'initiator role1'
        });

        expect(role[0].title).toEqual('initiator1');
    });

    it('should find a tenant', async () => {
        const tenant = await RBAC.createTenant({
            name: 'name',
            description: 'description',
            isActive: true
        });

        const foundTenant = await RBAC.findTenant(tenant.name);

        expect(foundTenant.name).toEqual(tenant.name);
    });

    it('should update a tenant', async () => {
        const tenant = await RBAC.createTenant({
            name: 'name',
            description: 'description',
            isActive: true
        });

        const updatedTenant = await RBAC.updateTenant(tenant.name, {
            description: 'updated'
        });

        expect(updatedTenant.description).toEqual('updated');
    });

    it('should find a role for a tenant', async () => {
        const tenant = await RBAC.createTenant({
            name: 'name',
            description: 'description',
            isActive: true
        });

        const role = await RBAC.createRole(tenant.slug, {
            title: 'initiator1',
            isActive: true,
            description: 'initiator role1'
        });

        const foundRole = await RBAC.findRole(tenant.id , 'initiator1');

        expect(foundRole.title).toEqual('initiator1');
    });

    it('should get a tenant with roles and permissions', async () => {
        const permissions = [
            'create-payment',
            'view-payment',
            'update-payment',
            'approve-payment',
            'delete-payment',
            'create-operator',
            'view-operator',
            'update-operator',
            'approve-operator',
            'delete-operator',
        ].map((permission) => ({
            title: permission,
            description: permission,
            isActive: true,
        }));

        await RBAC.createPermission(permissions);

        const tenant = await RBAC.createTenant({
            name: 'test-tenant',
            description: 'description',
            isActive: true
        });

        const role = await RBAC.createRole(tenant.slug, {
            title: 'initiator1',
            isActive: true,
            description: 'initiator role1'
        });

        await RBAC.syncRoleWithPermissions(tenant.id ,
            {
                role: role[0].slug,
                permissions: ['create-payment',
                    'view-payment',
                    'update-payment',
                    'approve-payment',]
            });


        const result = await RBAC.getTenantWithRolesAndPermissions(tenant.name);

        expect(result).toBeDefined();
        expect(result.roles![1].title).toBe('initiator1');
        expect(result.roles![0].permissions).toHaveLength(6);
        // expect(result.roles!.map((role) => role.permissions?.map(m => m.title))).toEqual(permissions);

    });


});