import { useRef, useState } from 'react';
import { assignments, findCourse, schedule } from '../content/catalog';
import ingestion from '../content/ingestion/bleecker.json';
import { classworkReview } from '../core/learning';
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
import { lifeIdeas, lifeIdeaPath } from '../content/life-sciences';
export default function Preparation({ id }: { id: string }) {
  const e = schedule.find((e) => e.id === id)!,
    state = useLearner(),
    [started, setStarted] = useState(false),
    [repair, setRepair] = useState(''),
    retry = useRef<() => void>(() => {});
  const course = e.course!,
    unit = eventUnit(e)!;
  const review = classworkReview(assignments, state.events, e.concepts).slice(
    0,
    8,
  );
  const topicPath = (id: string) => {
    const idea =
      course === 'life-sciences'
        ? lifeIdeas.find((idea) => idea.concept === id)
        : undefined;
    return idea ? lifeIdeaPath(idea.id) : `learn/${id}/`;
  };
  const related = assignments.filter(
    (a) =>
      a.course === course &&
      a.assistance !== 'independent-only' &&
      a.concepts.some((c) => e.concepts.includes(c)),
  );
  const scope =
    course === 'life-sciences'
      ? ingestion.sources
          .flatMap((s) => s.calendarEvents)
          .find((event) =>
            event.title
              .toLowerCase()
              .includes(
                id.startsWith('c17')
                  ? 'c17 test'
                  : id.startsWith('c18')
                    ? 'c18 test'
                    : 'c19 quiz',
              ),
          )?.assessmentScope
      : undefined;
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
      {scope && (
        <details className="teacher-scope">
          <summary>Teacher’s full assessment scope</summary>
          <p style={{ whiteSpace: 'pre-line' }}>{scope}</p>
        </details>
      )}
      {review.length > 0 && (
        <section>
          <h2>From your classwork</h2>
          <p>Start with the parts you marked difficult or used help on.</p>
          {review.map((item) => (
            <a
              className="material-row"
              key={item.assignment.id + item.question.id}
              href={url(`work/${item.assignment.id}/#${item.question.id}`)}
            >
              <span>
                <strong>
                  {item.assignment.title} · {item.question.number}
                </strong>
                <small>{item.reason}</small>
              </span>
              <Icon name="arrow" />
            </a>
          ))}
        </section>
      )}
      {related.length > 0 && (
        <details>
          <summary>Your notes & classwork for this assessment</summary>
          {related.map((a) => (
            <a className="resource-row" key={a.id} href={url(`work/${a.id}/`)}>
              {a.title}
              <Icon name="arrow" />
            </a>
          ))}
        </details>
      )}
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
                <a href={url(topicPath(id))}>
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
