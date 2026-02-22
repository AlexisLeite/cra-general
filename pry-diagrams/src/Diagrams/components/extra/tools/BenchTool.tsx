import { PiTestTubeFill } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';

export const BenchTool = observer(function BenchTool({
  onBench,
}: {
  onBench: () => void;
}) {
  return (
    <PiTestTubeFill
      className="tool"
      onClick={async () => {
        onBench();
      }}
      title="Bench"
    />
  );
});
