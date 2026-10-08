import type { CSSProperties } from 'react';
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    pencil: 'm15 4 5 5M4 20l4-1L21 6l-4-4L4 15z',
    flag: 'M5 21V3h12l-2 4 2 4H5',
    document: 'M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6',
    lab: 'M9 3h6M10 3v7L4 20h16l-6-10V3M7 15h10',
    layers: 'm3 7 9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4',
    review: 'M4 9a8 8 0 1 1 1 9M4 4v5h5M12 7v5l3 2',
    home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
    calendar: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14m-11 4h2m4 0h2m-8 4h2',
    search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    user: 'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    back: 'm14 6-6 6 6 6',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    close: 'm6 6 12 12M18 6 6 18',
    check: 'm5 12 4 4L19 6',
    book: 'M12 5v16M3 4c4-1 7-1 9 1 2-2 5-2 9-1v15c-4-1-7-1-9 1-2-2-5-2-9-1z',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
    help: 'M9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.book} />
    </svg>
  );
}
export function CourseMark({
  course,
  small = false,
}: {
  course: string;
  small?: boolean;
}) {
  return (
    <span
      className={`course-mark ${small ? 'small-mark' : ''}`}
      data-course={course}
      aria-hidden="true"
    >
      {course === 'physics' ? (
        <svg viewBox="0 0 24 24">
          <path d="M4 18h16M6 15l4-7 4 4 4-8" />
        </svg>
      ) : course === 'chemistry' ? (
        <svg viewBox="0 0 24 24">
          <path d="m12 3 8 5v8l-8 5-8-5V8zM12 3v8l8 5M12 11l-8 5" />
        </svg>
      ) : course === 'life-sciences' ? (
        <svg viewBox="0 0 24 24">
          <path d="M12 21V8M12 14C4 14 4 5 4 5s8 0 8 9Zm0 4c8 0 8-9 8-9s-8 0-8 9Z" />
        </svg>
      ) : (
        <span lang="ja">あ</span>
      )}
    </span>
  );
}
export function Coordinates({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`coordinates ${className}`}
      viewBox="0 0 340 160"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 120 102 94 178 108 246 48 306 32"
        className="coordinate-path"
      />
      {[
        [30, 120],
        [102, 94],
        [178, 108],
        [246, 48],
        [306, 32],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 4 ? 5 : 3}
          className="coordinate-point"
          style={{ '--point': i } as CSSProperties}
        />
      ))}
      {[
        [53, 38],
        [122, 25],
        [215, 131],
        [289, 111],
        [166, 54],
        [72, 145],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" className="coordinate-scatter" />
      ))}
    </svg>
  );
}
