import { useEffect, useMemo } from 'react';
import Japanese, { type JapaneseSection } from './Japanese';
import {
  japaneseMaterialDestination,
  japaneseWords,
  type JapaneseSet,
} from '../content/japanese';
import { url } from '../client/store';

const unitViews: Record<
  string,
  { section: JapaneseSection; sets?: JapaneseSet[] }
> = {
  writing: { section: 'kana' },
  greetings: { section: 'vocabulary', sets: ['greetings', 'classroom'] },
  numbers: { section: 'vocabulary', sets: ['numbers'] },
  colours: { section: 'this-week' },
};
export function JapaneseUnit({ unit }: { unit: string }) {
  const view = unitViews[unit];
  return <Japanese initialSection={view?.section} initialSets={view?.sets} />;
}

export default function JapaneseMaterial({ id }: { id: string }) {
  const view = useMemo(() => {
    const params = new URLSearchParams(
      `view=${japaneseMaterialDestination(id)}`,
    );
    return {
      section: params.get('view') as JapaneseSection,
      sets: params.get('sets')?.split(',') as JapaneseSet[] | undefined,
    };
  }, [id]);
  useEffect(() => {
    delete document.documentElement.dataset.pendingQuestion;
    const checkpoint = location.hash.slice(1).replace(/^q-q-/, 'q-');
    const word = japaneseWords.find(
      (word) => word.material === id && word.checkpoint === checkpoint,
    );
    location.replace(
      url(
        `courses/japanese/?view=${japaneseMaterialDestination(id)}${word ? `#${word.id}` : ''}`,
      ),
    );
  }, [id]);
  return <Japanese initialSection={view.section} initialSets={view.sets} />;
}
