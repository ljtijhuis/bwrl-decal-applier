export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
}

const SPONSORS: Sponsor[] = [
  {
    id: 'gitgud-racing',
    name: 'Gitgud Racing',
    logoUrl: '/sponsors/gitgud-racing.png',
    website: 'https://gitgudracing.com/',
  },
  {
    id: 'speedreels',
    name: 'Speed Reels',
    logoUrl: '/sponsors/speedreels.png',
    website: 'https://www.instagram.com/speedreels.official/',
  },
  {
    id: 'simmotion',
    name: 'Sim Motion',
    logoUrl: '/sponsors/simmotion.png',
    website: 'https://simmotion.com/',
  },
  {
    id: 'allstate-jevicky',
    name: 'Allstate — John Jevicky',
    logoUrl: '/sponsors/allstate-jevicky.png',
    website: 'https://agents.allstate.com/john-jevicky-pittsburgh-pa.html',
  },
  {
    id: 'rdoks',
    name: 'Rdoks',
    logoUrl: '/sponsors/rdoks.png',
    website: 'https://www.patreon.com/Rdoks',
  },
];

interface SponsorsProps {
  sponsors?: Sponsor[];
}

export function Sponsors({ sponsors = SPONSORS }: SponsorsProps) {
  if (sponsors.length === 0) return null;

  return (
    <section className="sponsors" aria-label="League sponsors">
      <div className="sponsors__inner">
        <h2 className="sponsors__heading">Our Sponsors</h2>
        <ul className="sponsors__list" role="list">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id} className="sponsors__item">
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsors__link"
                aria-label={`Visit ${sponsor.name}`}
              >
                <img
                  src={sponsor.logoUrl}
                  alt={`${sponsor.name} logo`}
                  className="sponsors__logo"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Sponsors;
