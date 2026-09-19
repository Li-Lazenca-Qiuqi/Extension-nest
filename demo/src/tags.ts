import { t } from './uiI18n';

const MAX_TAG_LENGTH = 30;
const MAX_TAG_COUNT = 10;

/**
 * 规范化扩展标签，去除首尾空白并按大小写不敏感规则去重。
 * 空白标签会被忽略；非字符串、超长标签和超过数量上限会抛出错误。
 */
export function normalizeTags(input: string[]): string[] {
  if (!Array.isArray(input)) {
    throw new TypeError(t('tags.mustBeArray'));
  }

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const value of input) {
    if (typeof value !== "string") {
      throw new TypeError(t('tags.mustBeString'));
    }

    const tag = value.trim();
    if (tag.length === 0) {
      continue;
    }
    if (Array.from(tag).length > MAX_TAG_LENGTH) {
      throw new RangeError(t('tags.maxLength',{count:MAX_TAG_LENGTH}));
    }

    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(tag);
    if (tags.length > MAX_TAG_COUNT) {
      throw new RangeError(t('tags.maxCount',{count:MAX_TAG_COUNT}));
    }
  }

  return tags;
}

/** 判断两个已经规范化的标签数组是否逐项相同。 */
export function tagsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}
