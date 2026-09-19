// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getUiLanguage, setUiLanguage, t } from './uiI18n';

let documentLanguage = '';
let browserLanguage = 'en-US';

beforeEach(() => {
  documentLanguage = document.documentElement.lang;
  browserLanguage = navigator.language;
  document.documentElement.lang = '';
  Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'en-US' });
  setUiLanguage(undefined);
});

afterEach(() => {
  document.documentElement.lang = documentLanguage;
  Object.defineProperty(window.navigator, 'language', { configurable: true, value: browserLanguage });
  setUiLanguage(undefined);
});

describe('uiI18n', () => {
  it('keeps English as the default and replaces named parameters', () => {
    expect(getUiLanguage()).toBe('en');
    expect(t('filter.selected', { count: 2 })).toBe('2 selected');
    setUiLanguage('en');
    expect(t('metric.notFound')).toBe('Not found');
  });

  it('uses Simplified Chinese for a zh document language', () => {
    document.documentElement.lang = 'zh-CN';
    expect(getUiLanguage()).toBe('zh');
    expect(t('metric.notFound')).toBe('未发现');
    expect(t('filter.selected', { count: 2 })).toBe('已选择 2 项');
  });

  it('falls back to navigator.language in a standalone browser', () => {
    Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'zh-TW' });
    expect(getUiLanguage()).toBe('zh');
  });

  it('allows an explicit host language to override document language', () => {
    document.documentElement.lang = 'zh-CN';
    setUiLanguage('en-US');
    expect(getUiLanguage()).toBe('en');
    setUiLanguage('zh-Hans');
    expect(getUiLanguage()).toBe('zh');
  });
});
