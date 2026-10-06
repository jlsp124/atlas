import { useRef, useState } from 'react';
import { findCourse, schedule } from '../content/catalog';
import {
  eventNote,
  eventTitle,
  eventUnit,
  teacherUnitResources,
  topicTitle,
  unitUrl,
} from '../content/workspaces';
import { displayDate } from '../core/dates';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import Coverage from './Coverage';
import QuestionSession from './QuestionSession';
import { Lesson } from './Lesson';
export default function Preparation({ id }: { id: string }) {
  const e = schedule.find((e) => e.id === id)!,
    state = useLearner(),
    [started, setStarted] = useState(false),
    [repair, setRepair] = useState(''),
    retry = useRef<() => void>(() => {});
  const course = e.course!,
    unit = eventUnit(e)!;
  if (started)
    return (
      <div className="flow-screen" data-course={course}>
        <div className="flow-top">
          <button className="quiet" onClick={() => setStarted(false)}>
            <Icon name="back" size={16} />
            {eventTitle(e)}
          </button>
          <span>Prepare</span>
        </div>
        <div className="session-holder" hidden={!!repair}>
          <QuestionSession
            course={course}
            ids={e.concepts}
            count={12}
            mode="Test simulation"
            onFinish={() => setStarted(false)}
            onRepair={(id, callback) => {
              retry.current = callback;
              setRepair(id);
            }}
          />
        </div>
        {repair && (
          <Lesson
            id={repair}
            allowRepair={false}
            onComplete={() => {
              setRepair('');
              retry.current();
            }}
          />
        )}
      </div>
    );
  return (
    <div className="prep-screen" data-course={course}>
      <div className="breadcrumbs">
        <a href={url(unitUrl(course, unit))}>
          <Icon name="back" size={16} />
          {findCourse(course).shortTitle}
        </a>
      </div>
      <p className="meta">
        {e.start ? displayDate(e.start, true) : 'I’m still checking the date.'}
      </p>
      <h1>{eventTitle(e)}</h1>
      <p className="screen-intro">{eventNote(e)}</p>
      {e.concepts.length ? (
        <>
          <h2>
            {id === 'chem-test-oct16'
              ? 'Material you can review'
              : 'What’s on it'}
          </h2>
          <ul className="prep-topics">
            {e.concepts.map((id) => (
              <li key={id}>
                <a href={url(`learn/${id}/`)}>
                  {topicTitle(id)}
                  <Icon name="arrow" size={16} />
                </a>
              </li>
            ))}
          </ul>
          <button
            className="primary"
            disabled={!state.ready}
            onClick={() => setStarted(true)}
          >
            Prepare
            <Icon name="arrow" />
          </button>
          <Coverage course={course} ids={e.concepts} />
        </>
      ) : (
        <>
          <p>
            I haven’t added the lessons for this yet. Start with the teacher’s
            guide.
          </p>
          {(teacherUnitResources[unit] ?? []).map((r) => (
            <a
              className="primary"
              href={r.url}
              key={r.url}
              target="_blank"
              rel="noreferrer"
            >
              {r.title}
              <Icon name="external" size={16} />
            </a>
          ))}
        </>
      )}
    </div>
  );
}
