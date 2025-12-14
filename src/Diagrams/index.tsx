import { Viewer } from './components/Viewer';
import { d } from './initializationFunctions';

export const Diagrams = () => {
  return (
    <>
      <Viewer diagram={d} />
    </>
  );
};
