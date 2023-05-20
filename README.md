# Multi-Tenant RBAC
Multi-Tenant RBAC (Role-Based Access Control) is a package that provides a simple and flexible way to manage access control and permission for multi-tenant applications. It is built on top of Sequelize ORM and supports various SQL databases.

## Installation
You can install Multi-Tenant RBAC using npm:

```bash
npm install multi-tenant-rbac
```

## Database Migration
You can run database migration using:
```bash
node ./node_modules/.bin/sequelize-cli db:migrate --url mysql://root:password@localhost:3306/lib_rbac --migrations-path ./node_modules/multi-tenant-rbac/src/migrations
```

This is a command to run database migrations using the Sequelize CLI tool. It specifies the database URL, the migrations path, and runs the db:migrate command.

The command should be executed in the terminal or command prompt in the root directory of the project.

## Here's what each part of the command does:

- `node ./node_modules/.bin/sequelize-cli:` Runs the Sequelize CLI tool.
db:migrate: Runs the db:migrate command, which applies pending migrations to the database.
`--url mysql://root:password@localhost:3306/lib_rbac`: Specifies the database URL. Replace `root` and `password` with the `username` and `password` for your `MySQL database`, respectively. `localhost` and `3306` specify the database `host` and `port`, respectively. `lib_rbac` is the name of the database.
--migrations-path ./node_modules/multi-tenant-rbac/src/migrations: Specifies the path where the migrations files are located. In this case, it is ./node_modules/multi-tenant-rbac/src/migrations.

# Usage
To use the package, you need to import the MultiTenantRBAC class and create an instance with the database configuration:



```ts
import MultiTenantRBAC, { rbacConfig } from "multi-tenant-rbac";
// for mysql
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

// for mongoose 
const config: rbacConfig = {
    dialect: 'mongodb',
    mongodbConfig : {
        url: 'url-mongodb-connection-url',
        useCreateIndex: true,
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }

/* create an instance of `MultiTenantRBAC` class 
and pass the configuration
*/
const RBAC = new MultiTenantRBAC(config);

```


Once you have created an instance, you can use the various methods provided by the package to manage `roles`, `permissions`, `tenants`, and `user roles`.

## Create Permissions
To create permissions, you can use the `createPermission` method:

```ts
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
```

## Create Tenant
To create a tenant, you can use the `createTenant` method:

```ts
const tenant = await RBAC.createTenant({
    name: 'name',
    description: 'description',
    isActive: true
});

```

## Create Role
To create a role, you can use the `createRole` method:

```ts
const role = await RBAC.createRole(tenant.slug, {
    title: 'initiator1',
    isActive: true,
    description: 'initiator role1'
});

```

## Find Tenant
To find a tenant, you can use the `findTenant` method:

```ts
const findTenant = await RBAC.findTenant(tenant.name);
```

## Update Tenant
To update a tenant, you can use the `updateTenant` method:

```ts
const updateTenant = await RBAC.updateTenant(tenant.name, {
    description: 'updated'
});

```

## Delete Tenant
To delete a tenant, you can use the `deleteTenant` method:

```ts
const deleteTenant = await RBAC.deleteTenant(tenant.name);

```

## Find Role
To find a role, you can use the `findRole` method:

```ts
const foundRole = await RBAC.findRole(findTenant.id , 'initiator1');

```

## Get Tenant With Role and Permissions
To get a tenant with its roles and permissions, you can use the `getTenantWithRoleAndPermissions` method:

```ts
const getUsers = await RBAC.getTenantWithRoleAndPermissions(tenant.name);

```

## Get User Role
To get a user's roles, you can use the `getUserRole` method:

```ts
// userId should a unique field that will be used to represent it's user
const userId = 'userId' 
const getUserRoles = await RBAC.getUserRole(tenant.id , userId);

```

## Assign Role to User
To assign a role to a user, you can use the `assignRoleToUser` method:

```ts
//this will add a new role to a user
// userId should a unique field that will be used to represent it's user
const addUserToRole = await RBAC.assignRoleToUser({
  roleSlug: foundRole.slug,
  tenantId: findTenant.id ,
  userId: 'user123',
});

   
```

## Sync User With Role
To sync a role to a user, you can use the `syncUserWithRole` method:
```ts
// this will replace the existing role with these new roles

const syncUserToRole = await RBAC.syncUserWithRole({
  role: ['initiator1', 'initiator2'],
  tenantId: findTenant.id ,
  userId: 'user123',
});

```

## Check User Permissions
To check if a user has a certain permission, you can use the  `userHasPermission` method:
```ts
const checkUserPermission = await RBAC.userHasPermission({
  permission: 'create-payment',
  userId: 'user123',
});

```

## Find Permission
You can find a permission by title or slug using the `findPermission` method.

```ts
const findPermissions = await RBAC.findPermission('create-payment');

```

## Add Role with Permissions
You can add a role with a list of permissions using the `addRoleWithPermissions` method.

```ts
const addRoleWithPermissions = await RBAC.addRoleWithPermissions(findTenant.id , {
  permissions: ['create-payment'],
  role: 'initiator',
});

```

## Conclusion
In conclusion, `multi-tenant-rbac` is a powerful package for implementing multi-tenant role-based access control in your Node.js applications. With its simple and intuitive API, it makes it easy to create and manage tenants, roles, permissions, and user roles.

In this example, we saw how to create a new instance of the `MultiTenantRBAC` class and use it to perform various RBAC-related operations, including creating tenants, roles, permissions, and user roles, assigning roles to users, and checking user permissions.

By following the usage example provided, you can easily integrate `multi-tenant-rbac` into your Node.js applications and secure your application resources from unauthorized access.

It should be noted that this readme only provides a brief overview of the `multi-tenant-rbac` package and the example code provided is not an exhaustive representation of all the classes and functionality that are available in the package. Additional classes, methods, and functionality can be found in the package's source code and documentation.


# Contribution and Support
If you find a bug or have a feature request, please create an issue in the [GitHub repository](https://github.com/donchi4all/multi-tenant-rbac/issues).

Pull requests are always welcome. For major changes, please open an issue first to discuss what you would like to change.

Pull requests are always welcome. For major changes, please open an issue first to discuss what you would like to change.

If you would like to support the development of this package, you can do so by:

- Starring the [GitHub repository](https://github.com/donchi4all/multi-tenant-rbac.git)
- Sharing the package with others
- Contributing code or documentation improvements
- Making a financial contribution through [Buy Me a Coffee](https://www.buymeacoffee.com/donsoft)

Thank you for your support!