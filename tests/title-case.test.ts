import { describe, expect, it } from 'vitest';
import { toTitleCase } from '../src/lib/title-case';

describe('toTitleCase', () => {
  it.each([
    ['hello world', 'Hello World'],
    ['HELLO WORLD', 'Hello World'],
    ['the quick brown fox jumps over the lazy dog', 'The Quick Brown Fox Jumps Over the Lazy Dog'],
    ['a tale of two cities', 'A Tale of Two Cities'],
    ['hello world. this is a test', 'Hello World. This Is a Test'],
    ['first! second? third.', 'First! Second? Third.'],
    ['  the end', '  The End'],
    ['hello!  world', 'Hello!  World'],
    ['hello.\nworld', 'Hello.\nWorld'],
    ["don't stop", "Don't Stop"],
    ['android app', 'Android App'],
    ['THE END OF THE ROAD', 'The End of the Road'],
    ['hello, the world', 'Hello, the World'],
    ['hello-world', 'Hello-world'],
    ['中文 测试', '中文 测试'],
    ['', ''],
  ])('将 %j 转换为 %j', (input, expected) => {
    expect(toTitleCase(input)).toBe(expected);
  });
});
