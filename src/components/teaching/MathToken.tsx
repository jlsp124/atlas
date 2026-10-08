export default function MathToken({ text }: { text: string }) {
  return /^v_[if]$/.test(text) ? (
    <>
      v<sub>{text.slice(2)}</sub>
    </>
  ) : (
    <>{text}</>
  );
}
