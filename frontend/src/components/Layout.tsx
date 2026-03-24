import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>HTTP Haiku</h1>
          <p>Poetry for every status code</p>
        </div>
      </header>
      <main className="main">
        <div className="container">{children}</div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 HTTP Haiku. Share your code poetry.</p>
        </div>
      </footer>
    </div>
  );
}
