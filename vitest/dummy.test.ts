import initializePlugin, { TestPlatform, type TestPlatformConfig } from '../src/module.js';

describe('TestPlatform', () => {
  it('dummy test', () => {
    expect('matterbridge').toBe('matterbridge');
  });
});
