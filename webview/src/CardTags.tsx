import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import type { Extension } from './models';
import { displayTags } from './tags';
import { t } from './uiI18n';

export default function CardTags({ extension, onFilter }: { extension: Extension; onFilter: (tag: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const tags = displayTags(extension);
  const contentKey = JSON.stringify(tags);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOverflow(element.scrollHeight > 21));
    };
    // 箭头绝对定位且预留固定空间，观测结果不改变被测宽度，避免缩放反馈循环。
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    measure();
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); };
  }, [contentKey]);
  return <div className="card-tags-region" tabIndex={overflow ? 0 : undefined}
    aria-label={overflow ? t('extension.expandTags') : undefined} title={overflow ? t('extension.expandTags') : undefined}>
    <div ref={ref} className="card-tags">{tags.map(tag => {
      const category = extension.categories?.some(value => value.toLocaleLowerCase() === tag.toLocaleLowerCase());
      return <button key={tag.toLocaleLowerCase()} className={category ? 'tag-chip tag-chip-category' : 'tag-chip'}
        title={t(category ? 'extension.filterByCategory' : 'extension.filterByTag', { tag })} onClick={() => onFilter(tag)}>
        <Tag size={10} aria-hidden="true" style={{ flexShrink: 0 }}/>{tag}
      </button>;
    })}</div>
    {overflow && <ChevronDown className="tags-expand-indicator" size={12} aria-hidden="true"/>}
  </div>;
}
