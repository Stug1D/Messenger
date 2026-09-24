import type { FormEvent } from "react";

type LoginScreenProps = {
  nameInput: string;
  setNameInput: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

// Zeigt die einfache Namensanmeldung des Prototyps.
export function LoginScreen({ nameInput, setNameInput, onSubmit }: LoginScreenProps) {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand-mark">M</div>
        <p className="eyebrow">A quieter way to connect</p>
        <h1>Good conversations<br /><em>start here.</em></h1>
        <p className="login-copy">Enter your name to step into your messages.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="name">Your name</label>
          <input id="name" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="e.g. Maya" autoFocus />
          <button type="submit">Continue <span>→</span></button>
        </form>
        <p className="login-note">No password needed for this prototype.</p>
      </section>
      <aside className="login-art" aria-label="Abstract conversation illustration">
        <div className="art-sun" />
        <div className="art-line line-one" />
        <div className="art-line line-two" />
        <div className="art-card card-one">A thought<br /><strong>worth sharing.</strong></div>
        <div className="art-card card-two">✦</div>
        <div className="art-caption">MESSENGER<br /><span>MAKE SPACE FOR EACH OTHER</span></div>
      </aside>
    </main>
  );
}