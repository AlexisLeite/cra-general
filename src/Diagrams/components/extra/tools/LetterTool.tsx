export const LetterTool = ({
  active,
  letters,
  onClick,
  title,
}: {
  letters: String;
  onClick: () => unknown;
  active: boolean;
  title: string;
}) => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      stroke-width="0"
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={`tool ${active ? 'selected' : ''}`}
    >
      <title>{title}</title>
      <text
        onClick={() => {
          onClick();
        }}
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="20"
        font-family={`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif"`}
        fill="currentColor"
        stroke="currentColor"
      >
        {letters}
      </text>
    </svg>
  );
};
