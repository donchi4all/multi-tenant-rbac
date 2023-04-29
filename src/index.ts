import Database from './modules/database';

import { RoleService } from './services/role';
import tenantService, { TenantInterface, TenantService } from './services/tenant';

export type TenantCreationType = Pick<
    TenantInterface,
    'name' | 'description' | 'isActive'
>;
interface MysqlConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

export interface MongodbConfig {
    url: string,
    useNewUrlParser: boolean,
    useFindAndModify: boolean,
    useCreateIndex: boolean,
    useUnifiedTopology: boolean,
}

export type rbacConfig = {
    dialect: 'mysql' | 'mongodb';
    mysqlConfig?: MysqlConfig;
    mongodbConfig?: MongodbConfig;
}

class MultiTenantRBAC {

    private config;
    constructor(config: rbacConfig) {
        this.config = config;
        this.loadDatabase(this.config);
    }

    public clearConsole(): void {
        process.stdout.write('\x1B[2J\x1B[0f');
    }

    public loadDatabase(config?: rbacConfig): void {
        Database.init(this.config || config);
    }

    public async createTenant(
        tenantData: TenantCreationType,
        returnIfFound: boolean = true
    ): Promise<TenantInterface> {
        return await tenantService.createTenant(tenantData, returnIfFound)
    }


}

export default MultiTenantRBAC;

