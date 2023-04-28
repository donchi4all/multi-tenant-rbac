# Multi-Tenant RBAC
Multi-Tenant RBAC is a Node.js package that provides a role-based access control (RBAC) system for multi-tenant applications. It allows you to manage roles and permissions at the tenant level, so each tenant can have its own set of roles and permissions.

## Installation
You can install Multi-Tenant RBAC using npm:

```bash
npm install multi-tenant-rbac
```

## Usage
Here's an example of how to use Multi-Tenant RBAC:

```ts
import { MultiTenantRBAC } from 'multi-tenant-rbac';

// Create a new instance of MultiTenantRBAC
const rbac = new MultiTenantRBAC();

// Add a tenant
const tenantId = 'tenant1';
rbac.addTenant(tenantId);

// Add a role to the tenant
const roleName = 'admin';
rbac.addRoleToTenant(roleName, tenantId);

// Add a permission to the role
const permissionName = 'create';
rbac.addPermissionToRole(permissionName, roleName, tenantId);

// Check if a user has permission to perform an action
const userId = 'user1';
const action = 'create';
const hasPermission = rbac.checkPermission(userId, action, tenantId);
if (hasPermission) {
  console.log(`${userId} is allowed to ${action} in ${tenantId}`);
} else {
  console.log(`${userId} is not allowed to ${action} in ${tenantId}`);
}
```

# API
## `Multi Tenant RBAC`
The main class of the package, representing a `multi-tenant` RBAC system. It provides the following methods:

`addTenant(tenantId: string): void`
Adds a new tenant to the RBAC system with the specified `tenantId`.

`removeTenant(tenantId: string): void`
Removes the tenant with the specified `tenantId` from the RBAC system.

`addRoleToTenant(roleName: string, tenantId: string): void`
Adds a new role with the specified `roleName` to the tenant with the specified `tenantId`.

`removeRoleFromTenant(roleName: string, tenantId: string): void`
Removes the role with the specified `roleName` from the tenant with the specified `tenantId`.

`addPermissionToRole(permissionName: string, roleName: string, tenantId: string): void`
Adds a new permission with the specified `permissionName` to the role with the specified `roleName` in the tenant with the specified `tenantId`.

`removePermissionFromRole(permissionName: string, roleName: string, tenantId: string): void`
Removes the permission with the specified `permissionName` from the role with the specified `roleName` in the tenant with the specified `tenantId`.

`checkPermission(userId: string, action: string, tenantId: string): boolean`
Checks if the user with the specified `userId` has permission to perform the specified action in the tenant with the specified `tenantId`. Returns true if the user has permission, false otherwise.

## Interfaces
The package also provides the following interfaces:

## ITenant
Represents a tenant in the RBAC system. Has a `tenantId` property.

## IRole
Represents a role in the RBAC system. Has a `roleName` property.

## IPermission
Represents a permission in the RBAC system. Has a `permissionName` property and a `roleName` property (the name of the role that the permission is associated with).

## Contributing
Pull requests are welcome. For major changes# multi-tenant-rbac
