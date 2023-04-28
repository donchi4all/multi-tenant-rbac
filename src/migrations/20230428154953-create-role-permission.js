'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rolePermissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      roleId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissionId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

     // Add indexes
     await queryInterface.addIndex('rolePermissions', ['roleId']);
     await queryInterface.addIndex('rolePermissions', ['permissionId']);
 
     // Add unique constraint
     await queryInterface.addConstraint('rolePermissions', {
       type: 'unique',
       fields: ['roleId', 'permissionId'],
       name: 'role_permission_unique_constraint',
     });
   
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rolePermissions');
  }
};