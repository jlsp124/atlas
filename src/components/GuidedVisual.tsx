import type { Walkthrough } from '../core/walkthrough';
import { conciseNumber } from '../core/walkthrough';

export default function GuidedVisual({
  guide,
  step,
}: {
  guide: Walkthrough;
  step: number;
}) {
  const phase = guide.steps[step].phase;
  if (guide.kind === 'lewis') {
    const progress = ['read', 'count', 'bonds', 'pairs', 'finish'].indexOf(
      phase,
    );
    const initial = [
      [164, 46],
      [176, 46],
      [188, 46],
      [200, 46],
      [212, 46],
      [224, 46],
      [80, 46],
      [308, 46],
    ];
    const bonded = [
      [134, 162],
      [146, 162],
      [246, 162],
      [258, 162],
    ];
    const pairs = [
      [188, 113],
      [200, 113],
      [188, 208],
      [200, 208],
    ];
    return (
      <figure
        className="teaching-diagram lewis-scene"
        aria-label="Water: eight valence electrons become two bonds and two lone pairs."
      >
        <figcaption>{guide.example}</figcaption>
        <svg
          viewBox="0 0 390 245"
          role="img"
          aria-label={
            progress < 2
              ? 'Oxygen contributes six electrons. Two hydrogens contribute one each.'
              : progress < 3
                ? 'Two pairs move into the oxygen–hydrogen bonds. Four electrons remain.'
                : 'Four electrons are in bonds. Four form two lone pairs on oxygen.'
          }
        >
          <text
            x="80"
            y="82"
            className="atom-contribution"
            data-on={progress === 1}
          >
            1
          </text>
          <text
            x="194"
            y="82"
            className="atom-contribution"
            data-on={progress === 1}
          >
            6
          </text>
          <text
            x="308"
            y="82"
            className="atom-contribution"
            data-on={progress === 1}
          >
            1
          </text>
          <path
            d="M99 162H174M214 162H288"
            className="chemical-bond"
            data-on={progress >= 2}
          />
          {[
            ['H', 80],
            ['O', 194],
            ['H', 308],
          ].map(([atom, x]) => (
            <text key={x} x={x} y="170" className="atom-letter">
              {atom}
            </text>
          ))}
          {initial.map(([x, y], i) => {
            // Each bond shares one oxygen electron and one hydrogen electron.
            const bond = [6, 0, 1, 7].indexOf(i);
            const pair = [2, 3, 4, 5].indexOf(i);
            const to =
              progress >= 2 && bond >= 0
                ? bonded[bond]
                : progress >= 3 && pair >= 0
                  ? pairs[pair]
                  : [x, y];
            return (
              <circle
                key={i}
                cx="0"
                cy="0"
                r="3.5"
                className="moving-electron"
                data-atom={i < 6 ? 'oxygen' : 'hydrogen'}
                data-place={
                  progress >= 2 && bond >= 0
                    ? 'bond'
                    : progress >= 3 && pair >= 0
                      ? 'lone-pair'
                      : 'budget'
                }
                style={{
                  transform: `translate(${to[0]}px, ${to[1]}px)`,
                  opacity: progress >= 1 ? 1 : 0,
                }}
              />
            );
          })}
        </svg>
        <div className="electron-budget" aria-live="polite">
          <span>8 total</span>
          <span>{progress >= 2 ? '4 in bonds' : '0 in bonds'}</span>
          <span>
            {progress >= 3
              ? '4 in lone pairs'
              : `${progress >= 2 ? 4 : 8} to place`}
          </span>
        </div>
      </figure>
    );
  }
  if (guide.kind === 'configuration' && guide.configuration) {
    const c = guide.configuration;
    const active = phase.startsWith('shell-')
      ? Number(phase.split('-')[1])
      : phase === 'read'
        ? -1
        : c.shells.length;
    const count = c.shells
      .slice(0, active + 1)
      .reduce((n, s) => n + s.count, 0);
    let core = 0;
    return (
      <figure className="teaching-diagram configuration-scene">
        <figcaption>
          {c.species} · {c.count} electrons
        </figcaption>
        <div className="electron-count">
          <span>{count} placed</span>
          <span>{c.count - count} left</span>
        </div>
        <div className="configuration-line" aria-label="Electron configuration">
          {c.core && (
            <span
              className="core-token"
              data-on={phase === 'core' || phase === 'finish'}
            >
              [{c.core}]
            </span>
          )}
          {c.shells.map((s, i) => {
            core += s.count;
            return (
              <span
                key={s.name}
                className={`subshell ${c.core && core <= c.coreCount && ['core', 'finish'].includes(phase) ? 'in-core' : ''}`}
                data-filled={i <= active}
                data-move-id={`shell-${i}`}
                data-on="true"
                aria-hidden={
                  !!c.core &&
                  core <= c.coreCount &&
                  ['core', 'finish'].includes(phase)
                }
              >
                <span>{s.name}</span>
                <sup>{i <= active ? s.count : '·'}</sup>
              </span>
            );
          })}
        </div>
        <div
          className="orbital-work"
          aria-label="Equal-energy orbitals fill singly before pairing"
        >
          <span>
            {c.shells[Math.min(Math.max(0, active), c.shells.length - 1)].name}{' '}
            orbitals
          </span>
          <div className="orbital-row">
            {Array.from({ length: 7 }, (_, i) => {
              const shell =
                c.shells[Math.min(Math.max(0, active), c.shells.length - 1)];
              const boxes = shell.name.endsWith('s')
                ? 1
                : shell.name.endsWith('p')
                  ? 3
                  : shell.name.endsWith('d')
                    ? 5
                    : 7;
              return (
                <span key={i} className="orbital" data-on={i < boxes}>
                  <span data-on={active >= 0 && i < shell.count}>↑</span>
                  <span data-on={active >= 0 && i + boxes < shell.count}>
                    ↓
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        <figcaption>
          The first number is the shell. The letter is the subshell. The
          superscript counts electrons.
        </figcaption>
      </figure>
    );
  }
  if (guide.kind === 'conversion' && guide.conversion) {
    const c = guide.conversion;
    if (c.factors) {
      const count = phase.startsWith('factor-')
        ? Number(phase.split('-')[1]) + 1
        : ['cancel', 'finish'].includes(phase)
          ? c.factors.length
          : 0;
      const cancel = ['cancel', 'finish'].includes(phase);
      const finalUnits = c.to.split('/');
      const unit = (s: string) => (
        <span
          className="cancel-unit"
          data-cancel={cancel && !finalUnits.includes(s)}
        >
          {s}
        </span>
      );
      const [topUnit, bottomUnit] = c.from.split('/');
      return (
        <figure className="teaching-diagram conversion-scene">
          <figcaption>Follow each unit from one factor to the next.</figcaption>
          <div className="factor-chain">
            <span className={bottomUnit ? 'fraction' : ''}>
              <span>
                {c.value} {unit(topUnit)}
              </span>
              {bottomUnit && <span>{unit(bottomUnit)}</span>}
            </span>
            {c.factors.map((f, i) => (
              <span key={i} className="conversion-factor" data-on={i < count}>
                <span>×</span>
                <span className="fraction">
                  <span>
                    {f.top} {unit(f.topUnit)}
                  </span>
                  <span>
                    {f.bottom} {unit(f.bottomUnit)}
                  </span>
                </span>
              </span>
            ))}
          </div>
          <p className="conversion-result" data-on={phase === 'finish'}>
            = {conciseNumber(c.result)} {c.to}
          </p>
        </figure>
      );
    }
    const index = [
      'read',
      'factor-one',
      'factor-two',
      'cancel',
      'finish',
    ].indexOf(phase);
    return (
      <figure className="teaching-diagram conversion-scene">
        <figcaption>Keep the amount. Change the unit.</figcaption>
        <div className="factor-chain">
          <span data-origin-id="conversion-value">
            {c.value}{' '}
            <span className="cancel-unit" data-cancel={index >= 3}>
              {c.from}
            </span>
          </span>
          <span className="conversion-factor" data-on={index >= 1}>
            <span>×</span>
            <span className="fraction">
              <span>
                {c.fromFactor}{' '}
                <span className="cancel-unit" data-cancel={index >= 3}>
                  {c.base}
                </span>
              </span>
              <span>
                1{' '}
                <span className="cancel-unit" data-cancel={index >= 3}>
                  {c.from}
                </span>
              </span>
            </span>
          </span>
          <span className="conversion-factor" data-on={index >= 2}>
            <span>×</span>
            <span className="fraction">
              <span>1 {c.to}</span>
              <span>
                {c.toFactor}{' '}
                <span className="cancel-unit" data-cancel={index >= 3}>
                  {c.base}
                </span>
              </span>
            </span>
          </span>
        </div>
        <p className="conversion-result" data-on={index >= 4}>
          = {conciseNumber(c.result)} {c.to}
        </p>
      </figure>
    );
  }
  if (!guide.visual) return null;
  const level =
    step === 0
      ? 0
      : guide.steps[step].phase === 'finish'
        ? 3
        : Math.min(3, step);
  if (guide.visual === 'motion-graphs') {
    const position = guide.example?.startsWith('Position');
    const slopeUnit = position ? 'm/s' : 'm/s²';
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>
          Example · {position ? 'position' : 'velocity'}–time graph
        </figcaption>
        <svg
          viewBox="0 0 390 230"
          role="img"
          aria-label={`A straight graph rises by 6 ${position ? 'metres' : 'metres per second'} in 3 seconds. Its slope is 2 ${slopeUnit}.`}
        >
          <path d="M55 35V177H338" className="branch-base" />
          <text x="55" y="22">
            {position ? 'Position (m)' : 'Velocity (m/s)'}
          </text>
          <text x="253" y="206">
            Time (s)
          </text>
          <text x="40" y="194">
            0
          </text>
          <text x="31" y="73">
            6
          </text>
          <text x="306" y="194">
            3
          </text>
          <path
            d="M55 177 312 65"
            className="branch-trace"
            data-on={level >= 1}
          />
          <path
            d="M55 177H312V65"
            className="graph-rise-run"
            data-on={level >= 2}
          />
          <circle cx="55" cy="177" r="3" className="branch-point" />
          <circle
            cx="312"
            cy="65"
            r="3"
            className="branch-point"
            data-on={level >= 1}
          />
          <text x="185" y="165" textAnchor="middle" data-on={level >= 2}>
            run = 3 s
          </text>
          <text x="200" y="60" data-on={level >= 2}>
            rise = 6 {position ? 'm' : 'm/s'}
          </text>
        </svg>
        <figcaption data-on={level >= 2}>
          Slope = rise ÷ run = 6 ÷ 3 = 2 {slopeUnit}. Use the axes and points on
          your actual graph.
        </figcaption>
      </figure>
    );
  }
  if (guide.visual === 'atomic-identity')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Example · read the numbers in ²³₁₁Na</figcaption>
        <svg
          viewBox="0 0 390 180"
          role="img"
          aria-label="Sodium-23: atomic number 11 means 11 protons. Mass number 23 means 12 neutrons. A neutral atom has 11 electrons."
        >
          <text x="115" y="107" className="atom-letter">
            Na
          </text>
          <text x="73" y="67" className="isotope-number">
            23
          </text>
          <text x="73" y="116" className="isotope-number">
            11
          </text>
          <path d="M94 111H185" className="branch-trace" data-on={level >= 1} />
          <text x="202" y="116" data-on={level >= 1}>
            11 protons
          </text>
          <text x="202" y="67" data-on={level >= 2}>
            23 − 11 = 12 neutrons
          </text>
          <text x="202" y="157" data-on={level >= 3}>
            11 electrons if neutral
          </text>
        </svg>
        <figcaption>
          Atomic number counts protons. Mass number counts protons plus
          neutrons. Charge changes the electron count.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'valence-electrons')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Example · magnesium: 1s² 2s² 2p⁶ 3s²</figcaption>
        <svg
          viewBox="0 0 390 210"
          role="img"
          aria-label="Magnesium has 12 electrons. Its outer shell contains two valence electrons."
        >
          <text x="150" y="112" className="atom-letter">
            Mg
          </text>
          {[24, 51, 78].map((radius, i) => (
            <circle
              key={radius}
              cx="150"
              cy="106"
              r={radius}
              className="electron-shell"
              data-on={level >= i + 1}
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const shell = i < 2 ? 0 : i < 10 ? 1 : 2;
            const angle =
              i < 2
                ? i * Math.PI
                : i < 10
                  ? ((i - 2) * Math.PI) / 4
                  : (i - 10) * Math.PI;
            const radius = [24, 51, 78][shell];
            const filled = level > shell;
            return (
              <circle
                key={i}
                r="3.5"
                cx="0"
                cy="0"
                className="moving-electron"
                style={{
                  transform: `translate(${filled ? 150 + Math.cos(angle) * radius : 42 + i * 25}px, ${filled ? 106 + Math.sin(angle) * radius : 12}px)`,
                }}
              />
            );
          })}
          <text x="252" y="84" data-on={level >= 3}>
            outer shell: n = 3
          </text>
          <text x="252" y="109" data-on={level >= 3}>
            2 valence electrons
          </text>
        </svg>
        <figcaption>
          The outer shell has the largest shell number. Use your assigned
          configuration to count its electrons.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'half-life')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Model · successive half-lives</figcaption>
        <svg
          viewBox="0 0 390 210"
          role="img"
          aria-label={`${100 / 2 ** level}% parent isotope remains after ${level} half-lives.`}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <circle
              key={i}
              cx={95 + (i % 4) * 54}
              cy={40 + Math.floor(i / 4) * 40}
              r="10"
              className="isotope"
              data-parent={i < 16 / 2 ** level}
            />
          ))}
          <text x="195" y="204" textAnchor="middle">
            {level} half-lives · {100 / 2 ** level}% parent remains
          </text>
        </svg>
        <figcaption>
          Each interval halves what remains. Pale dots represent daughter atoms.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'cladograms')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Example · follow the shared branch points</figcaption>
        <svg
          viewBox="0 0 390 220"
          role="img"
          aria-label="A and B share the most recent ancestor. C branches earlier."
        >
          <path
            d="M35 185H95V65H208M95 165H330M208 65V35H330M208 65V95H330"
            className="branch-base"
          />
          <path
            d="M208 65V35H330M208 65V95H330"
            className="branch-trace"
            data-on={level >= 1}
          />
          <circle
            cx="208"
            cy="65"
            r={level >= 2 ? 7 : 4}
            className="branch-point"
          />
          {[
            ['A', 40],
            ['B', 100],
            ['C', 170],
          ].map(([s, y]) => (
            <text key={s} x="347" y={y}>
              {s}
            </text>
          ))}
          <text x="145" y="142" className="diagram-detail" data-on={level >= 2}>
            A + B share this ancestor
          </text>
          <text x="35" y="209">
            root
          </text>
        </svg>
        <figcaption>
          Tip order does not change the branching relationships.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'relative-dating')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Model · an undisturbed stack of rock layers</figcaption>
        <svg
          viewBox="0 0 390 210"
          role="img"
          aria-label="In undisturbed layers, lower layers are older than layers above them."
        >
          {['younger', 'middle', 'older'].map((word, i) => (
            <g key={word}>
              <path
                d={`M55 ${24 + i * 54}H290V${72 + i * 54}H55Z`}
                className={`rock-layer rock-${i}`}
              />
              <text
                x="315"
                y={55 + i * 54}
                className="diagram-detail"
                data-on={level >= 1}
              >
                {word}
              </text>
            </g>
          ))}
          <path
            d="M43 30V175m-5-7 5 7 5-7"
            className="branch-trace"
            data-on={level >= 2}
          />
        </svg>
        <figcaption>
          Check the original diagram for faults, intrusions or disturbed layers.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'endosymbiosis')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>
          Model · one cell becomes a lasting partner inside another
        </figcaption>
        <svg
          viewBox="0 0 390 220"
          role="img"
          aria-label="A bacterium is taken into a host cell and becomes a lasting energy-producing partner."
        >
          <ellipse cx="190" cy="108" rx="100" ry="80" className="host-cell" />
          <circle cx="163" cy="110" r="25" className="cell-nucleus" />
          <g
            className="bacterium"
            style={{
              transform: `translate(${level >= 1 ? 224 : 330}px, ${level >= 1 ? 90 : 140}px)`,
            }}
          >
            <ellipse rx="24" ry="13" />
            <path d="M-13 0l7-5 6 10 6-10 7 5" />
          </g>
          <path
            d="M255 50c20 10 35 25 38 45"
            className="branch-trace"
            data-on={level >= 2}
          />
          <text x="195" y="212" textAnchor="middle">
            {level < 1
              ? 'host + bacterium'
              : level < 2
                ? 'engulfed, but not digested'
                : 'a lasting partnership'}
          </text>
        </svg>
        <figcaption>
          Link your explanation to evidence in class: DNA, division and
          membranes.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'classification')
    return (
      <figure className="teaching-diagram hierarchy-scene">
        <figcaption>From broad groups to specific ones</figcaption>
        <ol>
          {[
            'Kingdom',
            'Phylum',
            'Class',
            'Order',
            'Family',
            'Genus',
            'Species',
          ].map((name, i) => (
            <li
              key={name}
              style={{ marginLeft: `${i * 12}px` }}
              data-on={level > 0 || i === 0}
            >
              {name}
            </li>
          ))}
        </ol>
        <figcaption>
          For a key, follow the observable features on the original sheet.
        </figcaption>
      </figure>
    );
  if (['vsepr', 'electron-groups'].includes(guide.visual))
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Example · CO₂ has two electron groups</figcaption>
        <svg
          viewBox="0 0 390 180"
          role="img"
          aria-label="Oxygen double-bond carbon double-bond oxygen. Each double bond is one group."
        >
          <text x="64" y="95" className="atom-letter">
            O
          </text>
          <text x="195" y="95" className="atom-letter">
            C
          </text>
          <text x="326" y="95" className="atom-letter">
            O
          </text>
          <path
            d="M88 80H173M88 91H173M217 80H302M217 91H302"
            className="chemical-bond"
            data-on={level >= 1}
          />
          <path
            d="M100 65H162M228 65H290"
            className="group-bracket"
            data-on={level >= 2}
          />
          <text x="132" y="52" textAnchor="middle" data-on={level >= 2}>
            1 group
          </text>
          <text x="258" y="52" textAnchor="middle" data-on={level >= 2}>
            1 group
          </text>
        </svg>
        <figcaption>
          A multiple bond counts as one direction. Lone pairs count as groups
          too.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'periodic-trends')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Model · two reasons to compare</figcaption>
        <svg
          viewBox="0 0 390 210"
          role="img"
          aria-label="Down a group, extra shells place outer electrons farther from the nucleus. Across a period, nuclear attraction generally increases."
        >
          {[110, 280].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="100" r="10" className="branch-point" />
              <circle cx={x} cy="100" r="35" className="electron-shell" />
              {i === 1 && (
                <circle
                  cx={x}
                  cy="100"
                  r={level >= 1 ? 65 : 35}
                  className="electron-shell"
                />
              )}
              <circle
                cx={x + (i === 1 && level >= 1 ? 65 : 35)}
                cy="100"
                r="4"
                className="branch-point"
              />
              <text x={x} y="190" textAnchor="middle">
                {i === 0 ? 'fewer shells' : 'more shells'}
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          More distance and shielding generally weaken the pull on outer
          electrons.
        </figcaption>
      </figure>
    );
  if (guide.visual === 'electronegativity' || guide.visual === 'bond-types')
    return (
      <figure className="teaching-diagram biological-scene">
        <figcaption>Example · uneven sharing in H—F</figcaption>
        <svg
          viewBox="0 0 390 180"
          role="img"
          aria-label="Fluorine pulls the shared electron pair more strongly. Hydrogen is partially positive and fluorine partially negative."
        >
          <text x="90" y="97" className="atom-letter">
            H
          </text>
          <text x="300" y="97" className="atom-letter">
            F
          </text>
          <path
            d="M110 87H280"
            className="chemical-bond"
            data-on={level >= 1}
          />
          {[0, 1].map((i) => (
            <circle
              key={i}
              cx="0"
              cy="0"
              r="4"
              className="moving-electron"
              style={{
                transform: `translate(${level >= 2 ? 246 + i * 12 : 188 + i * 12}px, 87px)`,
                opacity: level > 0 ? 1 : 0,
              }}
            />
          ))}
          <text x="90" y="55" textAnchor="middle" data-on={level >= 2}>
            δ+
          </text>
          <text x="300" y="55" textAnchor="middle" data-on={level >= 2}>
            δ−
          </text>
        </svg>
        <figcaption>
          These partial charges come from sharing. They are not full ionic
          charges.
        </figcaption>
      </figure>
    );
  return null;
}
