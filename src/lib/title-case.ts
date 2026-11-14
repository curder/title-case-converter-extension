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

// 词由 Unicode 字母/数字组成，可包含撇号与连字符；组合字符（如分解的重音）一并纳入
const WORD = /[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’-]*/gu;
const APOSTROPHE = /(['’])/;

/** 首字母大写、其余小写 */
function titleCasePart(part: string): string {
  const chars = Array.from(part);
  if (chars.length === 0) {
    return part;
  }
  return chars[0].toUpperCase() + chars.slice(1).join('').toLowerCase();
}

/** 撇号后的部分：保留首字母原有大小写，其余小写（O'Brien、don't） */
function keepInitialCasePart(part: string): string {
  const chars = Array.from(part);
  if (chars.length === 0) {
    return part;
  }
  return chars[0] + chars.slice(1).join('').toLowerCase();
}

/** 先按连字符分段，再处理撇号，避免 O'Brien-Smith 被拆坏 */
function capitalizeWord(word: string): string {
  return word
    .split('-')
    .map((part) => {
      const pieces = part.split(APOSTROPHE);
      const hasHead = pieces[0] !== '';

      return pieces
        .map((piece, index) => {
          // split 带捕获组时，奇数下标是撇号本身
          if (index % 2 === 1) {
            return piece;
          }
          if (index === 0) {
            return titleCasePart(piece);
          }
          return hasHead ? keepInitialCasePart(piece) : titleCasePart(piece);
        })
        .join('');
    })
    .join('-');
}

/**
 * 将文本转换为 Title Case：
 * - 每个句子（以 . ! ? 加空白分隔）的首词大写
 * - 其余词命中 LOWERCASE_WORDS 时保持小写，否则首字母大写
 * - 连字符分隔的各部分分别大写；撇号后的部分保留原有首字母大小写
 */
export function toTitleCase(text: string): string {
  const parts = text.split(SENTENCE_BREAK);

  return parts
    .map((segment, index) => {
      // split 带捕获组时，奇数下标是分隔符，偶数下标是句子正文
      if (index % 2 === 1) {
        return segment;
      }

      // 句子末尾的单字母可能属于跨分句的缩写（如 U.S.A. today 的 A），需结合分隔符判断
      const following = parts[index + 1] ?? '';
      let isFirstWord = true;

      return segment.replace(WORD, (word, offset, whole) => {
        const atSegmentEnd = offset + word.length === whole.length;
        const isInitial =
          Array.from(word).length === 1 &&
          (whole.charAt(offset + word.length) === '.' || (atSegmentEnd && following.startsWith('.')));

        if (isFirstWord) {
          isFirstWord = false;
          return capitalizeWord(word);
        }
        if (isInitial) {
          return word;
        }
        return LOWERCASE_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : capitalizeWord(word);
      });
    })
    .join('');
}
