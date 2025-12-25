describe('models/index.js', () => {
  const fs = require('fs');
  const path = require('path');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to ensure clean state
    jest.resetModules();
  });

  test('should export db object with sequelize', () => {
    // Simply require the module to execute the code
    const db = require('../models/index');

    // Verify that the db object has the expected structure
    expect(db).toBeDefined();
    expect(db).toHaveProperty('sequelize');
    expect(db).toHaveProperty('Sequelize');
    expect(db.sequelize).toBeDefined();
    expect(db.Sequelize).toBeDefined();

    // Verify that models are loaded
    expect(db.User).toBeDefined();
    expect(db.Menu).toBeDefined();
    expect(db.Keranjang).toBeDefined();
    expect(db.Pesanan).toBeDefined();
    expect(db.Meja).toBeDefined();
  });

  test('should handle config with use_env_variable', () => {
    // Mock config with use_env_variable
    const mockConfig = {
      development: {
        use_env_variable: 'DATABASE_URL',
        dialect: 'mysql'
      }
    };
    jest.doMock('../config/config.json', () => mockConfig, { virtual: true });

    // Set env var
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/testdb';
    process.env.NODE_ENV = 'development';

    // Require after mocking
    const db = require('../models/index');

    expect(db).toBeDefined();
    expect(db.sequelize).toBeDefined();
  });

  test('should handle config without use_env_variable', () => {
    // Mock config without use_env_variable
    const mockConfig = {
      development: {
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        host: 'localhost',
        dialect: 'mysql'
      }
    };
    jest.doMock('../config/config.json', () => mockConfig, { virtual: true });

    process.env.NODE_ENV = 'development';

    // Require after mocking
    const db = require('../models/index');

    expect(db).toBeDefined();
    expect(db.sequelize).toBeDefined();
  });

  test('should default to development when NODE_ENV is not set', () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;

    // Delete NODE_ENV to test default behavior
    delete process.env.NODE_ENV;

    // Reset modules to re-execute index.js
    jest.resetModules();

    // Require the module
    const db = require('../models/index');

    expect(db).toBeDefined();
    expect(db.sequelize).toBeDefined();

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  test('should handle models without associate method', () => {
    // Mock fs.readdirSync to include a dummy model file
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['user.js', 'dummy.js']);

    // Mock dummy.js return value (a model without associate)
    jest.doMock('../models/dummy.js', () => {
      return (sequelize, DataTypes) => {
        return { name: 'Dummy' }; // No associate method
      };
    }, { virtual: true });

    // Require the module
    const db = require('../models/index');

    expect(db.Dummy).toBeDefined();
    expect(db.Dummy.associate).toBeUndefined();

    // The code should not crash when iterating over Dummy
    expect(db).toBeDefined();
  });
});
