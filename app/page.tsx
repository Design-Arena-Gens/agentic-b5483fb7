import { FlyingHorseGame } from "./components/FlyingHorseGame";

export default function Page() {
  return (
    <main className="page">
      <div className="page__content">
        <header className="page__header">
          <h1>Sky Cavalry Clash</h1>
          <p>
            Command a squad of four legendary flying horsemen. Trade control mid-flight, weave through streaming clouds,
            and harvest radiant sky orbs to prove your aerial mastery.
          </p>
        </header>
        <FlyingHorseGame />
        <section className="page__tips">
          <h2>Tips</h2>
          <ul>
            <li>Use the arrow keys to dart between clouds while keeping momentum under control.</li>
            <li>Swap to the horseman closest to a sky orb to maintain a steady collection rhythm.</li>
            <li>Boost sparingly—overheating your flight lanes will send you bouncing off the sky barrier.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
