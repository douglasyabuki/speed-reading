import { Header } from "@/components/header";

interface Layout {
  children: React.ReactNode;
}

export const Layout = ({ children }: Layout) => {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col mx-auto w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Header />
      {children}
    </main>
  );
};
