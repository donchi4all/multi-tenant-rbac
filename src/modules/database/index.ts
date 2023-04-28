import mongoose from 'mongoose'
import { LoggerDecorator, LoggerInterface } from '../logger'
import { Repository, Sequelize, Model } from 'sequelize-typescript';
import * as Models from '../../models';


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


export interface rbacConfig {
  dialect: 'mysql' | 'mongodb';
  mysqlConfig?: MysqlConfig;
  mongodbConfig?: MongodbConfig;
}


export class Database {
  @LoggerDecorator('Database')
  private log: LoggerInterface;
  private sequelize: Sequelize;

  public async init(config: rbacConfig): Promise<void> {

    if (config.dialect === 'mongodb') {
      const { url } = config.mongodbConfig
      await this.connect(url)
      mongoose.connection.on('disconnected', this.connect.bind(this, url))
      this.log.info(`Successfully connected to ${url}`)
    } else if (config.dialect === 'mysql') {
      const { mysqlConfig } = config
      this.sequelize = new Sequelize({
        ...mysqlConfig,
        pool: { max: 1 },
        models: Object.values(Models),
        logging: false,
      });
      this.log.info('Sequelize ORM with mariaDb has been created successfully.');

    }
  }

  async connect(url: string) {
    try {
      await mongoose.connect(url)
    } catch (error) {
      this.log.error(`Error connecting to database: ${error}`)
      throw error
    }
  }

  static connection() {
    return mongoose.connection;
  }

}

export default new Database()
