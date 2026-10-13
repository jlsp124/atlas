import { useEffect, useState } from 'react';
import type { Assignment, CompanionQuestion } from '../core/schema';
import { makeWalkthrough } from '../core/walkthrough';
import { lewisModels } from '../content/chemistry-lewis';
import { url } from '../client/store';
import { Icon } from './Icons';
import ReadableText from './ReadableText';
import { ChemistryNavigation } from './Chemistry';
import ChemWorking from './ChemWorking';
import ChemLewis from './ChemLewis';
import ChemPrompt from './ChemPrompt';
import { ionConfigurations } from '../content/chemistry-electrons';
import ChemIon from './ChemIon';

export const isCapturedBondingReference = (q: CompanionQuestion) =>
  /^q-(80|81|83)$/.test(q.id);
export function briefChemHelp(q: CompanionQuestion) {
  if (q.concepts.includes('atomic-identity')) {
    if (/find.*atomic number|give.*atomic number/i.test(q.prompt))
      return 'Find the element on the periodic table. Its atomic number is the number you need.';
    if (/neutron/i.test(q.prompt))
      return 'Subtract the atomic number (protons) from the mass number (protons + neutrons). Use the isotope’s stated mass number, not the periodic table’s average atomic mass.';
    if (/electron/i.test(q.prompt))
      return 'For a neutral atom, electrons equal the atomic number. For an ion, subtract the signed charge: positive ions have fewer electrons, negative ions have more.';
  }
  return q.hints[0];
}
export default function ChemAssignment({
  assignment: a,
}: {
  assignment: Assignment;
}) {
  const [focused, setFocused] = useState(''),
    [reference, setReference] = useState(false),
    [working, setWorking] = useState<string[]>([]);
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      setFocused(id);
      const q = a.companionQuestions?.find((q) => q.id === id);
      setReference(
        a.id === 'chemistry-hebden-bonding' &&
          (new URLSearchParams(location.search).has('reference') ||
            (!!q && isCapturedBondingReference(q))),
      );
      if (
        new URLSearchParams(location.search).has('step') ||
        new URLSearchParams(location.search).has('focus')
      )
        setWorking(q ? [q.id] : []);
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: 'start' }),
      );
    };
    reveal();
    addEventListener('hashchange', reveal);
    return () => removeEventListener('hashchange', reveal);
  }, [a]);
  if (a.assistance === 'independent-only')
    return (
      <div className="chem-screen" data-course="chemistry">
        <div className="breadcrumbs">
          <a href={url('courses/chemistry/')}>
            <Icon name="back" size={16} />
            Chemistry
          </a>
        </div>
        <h1>{a.title}</h1>
        <section className="restricted-work">
          <h2>Formal hand-in · instructions only</h2>
          <p>{a.notes}</p>
          <p>{a.originalAvailability}</p>
          {a.tasks.map((task) => (
            <p key={task.id}>{task.instructions}</p>
          ))}
        </section>
      </div>
    );
  const questions = (a.companionQuestions ?? []).filter(
    (q) =>
      a.id !== 'chemistry-hebden-bonding' ||
      isCapturedBondingReference(q) === reference,
  );
  return (
    <div className="chem-screen chem-assignment" data-course="chemistry">
      <div className="breadcrumbs">
        <a href={url(`courses/chemistry/units/${a.unit}/`)}>
          <Icon name="back" size={16} />
          Chemistry
        </a>
      </div>
      <p className="meta">Mrs. Cote · Hebden</p>
      <h1>{reference ? 'Other captured bonding questions' : a.title}</h1>
      <ChemistryNavigation
        view={reference ? 'notes' : 'assignments'}
        unit={a.unit}
      />
      <p className="chem-intro">
        {reference
          ? 'p.182 · 80, 81, 83 are captured reference questions, outside the range assigned on teacher-note p.24.'
          : a.summary}
      </p>
      <p className="chem-source-note">{a.originalAvailability}</p>
      <div className="chem-questions">
        {questions.map((q) => {
          const model = lewisModels.find((m) => q.id === `q-86${m.part}`);
          const ion =
            a.id === 'chemistry-hebden-electrons'
              ? ionConfigurations.find((m) => q.id === `q-28${m.part}`)
              : undefined;
          const guide = makeWalkthrough(a, q);
          const visual =
            !model &&
            ['conversion', 'configuration', 'lewis'].includes(guide.kind);
          return (
            <details
              className="chem-question"
              id={q.id}
              key={q.id}
              open={focused === q.id}
              onToggle={(e) => {
                if (e.currentTarget.open && focused !== q.id) setFocused(q.id);
              }}
            >
              <summary>
                <span className="chem-question-number">{q.number}</span>
                <span>
                  <ReadableText text={q.prompt} />
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="chem-question-body">
                <p className="chem-asking">
                  <strong>What it’s asking</strong>
                  {q.asking}
                </p>
                {ion ? (
                  <ChemIon model={ion} />
                ) : model && !model.promptOnly ? (
                  <ChemLewis model={model} />
                ) : (
                  <>
                    <p>
                      <ReadableText text={briefChemHelp(q)} />
                    </p>
                    {visual && (
                      <>
                        <button
                          className="quiet"
                          aria-expanded={working.includes(q.id)}
                          onClick={() =>
                            setWorking(
                              working.includes(q.id)
                                ? working.filter((id) => id !== q.id)
                                : [...working, q.id],
                            )
                          }
                        >
                          {working.includes(q.id)
                            ? 'Hide the working'
                            : 'Show the working'}{' '}
                          <Icon name="arrow" size={15} />
                        </button>
                        {working.includes(q.id) && (
                          <ChemWorking assignment={a} question={q} />
                        )}
                      </>
                    )}
                    {!visual && q.checklist && (
                      <div className="chem-answer-needs">
                        <p className="meta">Your paper response</p>
                        <ul>
                          {q.checklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {model?.promptOnly && (
                      <ChemPrompt
                        prompt={`Help me understand Mrs. Cote’s Chemistry 11 Hebden p.188 question ${q.number}: ${q.prompt}\nSource context: ${model.promptOnly}\nTeacher conventions: keep the printed skeleton. Count valence electrons; adjust for the overall charge. H needs a duet, ordinary second-period atoms need octets, and the taught Be/B and expanded-octet exceptions must be stated when relevant. Show why any lone pair becomes a multiple bond. Use formal charge = valence electrons − nonbonding electrons − half the bonding electrons; check its sum against the ion charge. Explain the alternatives in simple English, with a readable Lewis diagram. Ask for a clearer source photo if a connection is ambiguous; do not silently change it. I write the answer on my real sheet.`}
                      />
                    )}
                  </>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
