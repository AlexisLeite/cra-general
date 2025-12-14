import { PiTestTubeFill } from 'react-icons/pi';

export function BenchTool({ onBench }: { onBench: () => void }) {
  return (
    <PiTestTubeFill
      className="tool"
      onClick={async () => {
        onBench();
      }}
      title="Bench"
    />
  );
}
