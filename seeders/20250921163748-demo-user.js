'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     return queryInterface.bulkInsert('Users', [
      {
        username: 'Admin',
        password: 'semangatpagi',
        security_question: 'Siapa pemilik norin cafe',
        security_answer: "Norin",
      },
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null,{});
  },
};