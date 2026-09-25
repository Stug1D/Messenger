import type { FormEvent } from "react";

type LoginScreenProps = {
  authMode: "sign-in" | "sign-up";
  emailInput: string;
  passwordInput: string;
  nameInput: string;
  authError: string;
  setAuthMode: (mode: "sign-in" | "sign-up") => void;
  setEmailInput: (value: string) => void;
  setPasswordInput: (value: string) => void;
  setNameInput: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

// Zeigt Registrierung und Anmeldung für echte Better-Auth-Accounts.
export function LoginScreen({ authMode, emailInput, passwordInput, nameInput, authError, setAuthMode, setEmailInput, setPasswordInput, setNameInput, onSubmit }: LoginScreenProps) {
  const isSignUp = authMode === "sign-up";
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand-mark">M</div>
        <p className="eyebrow">A quieter way to connect</p>
        <h1>Good conversations<br /><em>start here.</em></h1>
        <p className="login-copy">Create an account or sign in to your messages.</p>
        <form className="login-form" onSubmit={onSubmit}>
          {isSignUp && <><label htmlFor="name">Your name</label><input id="name" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="e.g. Maya" autoFocus /></>}
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} placeholder="you@example.com" autoFocus={!isSignUp} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} placeholder="At least 8 characters" minLength={8} required />
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit">{isSignUp ? "Create account" : "Sign in"} <span>→</span></button>
        </form>
        <button className="auth-switch" type="button" onClick={() => setAuthMode(isSignUp ? "sign-in" : "sign-up")}>{isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}</button>
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