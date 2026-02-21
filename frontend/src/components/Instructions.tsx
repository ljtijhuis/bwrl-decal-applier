import { useState } from 'react';

const STEPS = [
  {
    title: 'Find your base livery',
    body: (
      <>
        Your TGA is in <code>Documents/iRacing/paint/[car folder]</code>, named{' '}
        <code>car_[yourCustomerID].tga</code>. If it isn&apos;t there yet, open Trading Paints,
        run your paint once in a session, and the Downloader will save it automatically.
      </>
    ),
  },
  {
    title: 'Upload your livery',
    body: 'Drag-and-drop or click to select your file in the upload area. TGA, PNG, and PSD are supported.',
  },
  {
    title: 'Select your car model',
    body: "Choose the car you're racing from the dropdown.",
  },
  {
    title: 'Select your driver class',
    body: 'Choose AM, Pro-Am, Pro, or Rookie (only shown for cars with class badges).',
  },
  {
    title: 'Click "Apply Decals"',
    body: 'The tool composites the league decals onto your livery and automatically downloads the result as a PNG.',
  },
  {
    title: 'Go to Trading Paints',
    body: (
      <>
        Visit{' '}
        <a href="https://www.tradingpaints.com" target="_blank" rel="noopener noreferrer">
          tradingpaints.com
        </a>{' '}
        and sign in, then click <strong>Upload</strong>.
      </>
    ),
  },
  {
    title: 'Upload the PNG',
    body: (
      <>
        Select the downloaded PNG, choose the correct vehicle, and upload to{' '}
        <strong>My Paints</strong>.
      </>
    ),
  },
  {
    title: 'Upload your spec map (optional)',
    body: (
      <>
        Also upload <code>car_spec_[yourCustomerID].mip</code> (or <code>.map</code>) from the
        same iRacing paints folder. This controls the shiny/matte finish of your car.
      </>
    ),
  },
];

interface InstructionsProps {
  autoCompleted?: ReadonlySet<number>;
}

export function Instructions({ autoCompleted }: InstructionsProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section className="instructions" aria-label="How to use this tool">
      <h2 className="instructions__heading">How to use this tool</h2>
      <ol className="instructions__list">
        {STEPS.map((step, i) => {
          const done = checked.has(i) || (autoCompleted?.has(i) ?? false);
          return (
            <li
              key={i}
              className={`instructions__item${done ? ' instructions__item--done' : ''}`}
            >
              <label className="instructions__label">
                <input
                  type="checkbox"
                  className="instructions__checkbox"
                  checked={done}
                  onChange={() => toggle(i)}
                />
                <span className="instructions__step-content">
                  <strong className="instructions__step-title">{step.title}</strong>
                  <span className="instructions__step-body">{step.body}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>
      <p className="instructions__tip">
        <strong>First time?</strong> Make sure the{' '}
        <a href="https://www.tradingpaints.com/page/Install" target="_blank" rel="noopener noreferrer">
          Trading Paints Downloader
        </a>{' '}
        app is installed and running — it distributes your livery to other racers in-session.
      </p>
    </section>
  );
}
