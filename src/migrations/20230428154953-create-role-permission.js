'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rolePermissions', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID
      },
      roleId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissionId: {
        allowNull: false,
        type: Sequelize.UUID,
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
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
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