'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      // staffID: {
      //   allowNull: false,
      //   type: Sequelize.STRING,
      // },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      password: {
        allowNull: true,
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('active', 'disable', 'blocked'),
        defaultValue: 'active'
      },
      // type: {
      //   allowNull: false,
      //   type: Sequelize.ENUM('user', 'superadmin', 'admin'),
      //   defaultValue: 'user'
      // },
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

    // await queryInterface.addConstraint('users', {
    //   fields: ['staffID', 'email'],
    //   type: 'unique',
    //   name: 'users_staffID_email_unique'
    // });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};