// 标题格式中保持小写的词（位于句首时仍会大写）
export const LOWERCASE_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'for',
  'nor',
  'on',
  'at',
  'to',
  'from',
  'by',
  'in',
  'of',
  'with',
]);

// 句子分隔符：结束标点及其后的空白，替换时原样保留
const SENTENCE_BREAK = /([.!?]\s+)/;

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * 将文本转换为 Title Case：
 * - 每个句子（以 . ! ? 加空白分隔）的首词大写
 * - 其余词命中 LOWERCASE_WORDS 时保持小写，否则首字母大写
 */
export function toTitleCase(text: string): string {
  return text
    .split(SENTENCE_BREAK)
    .map((segment, index) => {
      // split 带捕获组时，奇数下标是分隔符，偶数下标是句子正文
      if (index % 2 === 1) {
        return segment;
      }

      let isFirstWord = true;
      return segment.replace(/\w\S*/g, (word) => {
        if (isFirstWord) {
          isFirstWord = false;
          return capitalize(word);
        }
        return LOWERCASE_WORDS.has(word.toLowerCase())
          ? word.toLowerCase()
          : capitalize(word);
      });
    })
    .join('');
}
