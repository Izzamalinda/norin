'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
       await queryInterface.createTable('users', {
      id_user: {
        type: Sequelize.STRING(50),
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      security_question: {
        type: Sequelize.STRING,
        allowNull: false
      },
      security_answer: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  async down (queryInterface, Sequelize) {
  }
};
