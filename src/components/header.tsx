export const Header = () => {
  return (
    <header className="space-y-2 text-center flex flex-col items-center">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Speed Reader
      </h1>

      <p className="mx-auto max-w-2xl text-sm text-zinc-400 sm:text-base">
        Paste your text, choose the speed, and read one word at a time. The
        highlighted character stays red, and you can adjust the speed while
        reading.
      </p>
    </header>
  );
};
