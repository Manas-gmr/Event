import { Link } from 'react-router-dom';
import FuzzyText from '../components/FuzzyText';

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="relative z-10 text-center">
        <FuzzyText
          fontSize="clamp(4rem, 15vw, 12rem)"
          fontWeight={900}
          fontFamily="Space Mono"
          color="#7c6af7"
          baseIntensity={0.2}
          hoverIntensity={0.6}
        >
          404
        </FuzzyText>
        <p className="text-lg text-muted-foreground font-mono mt-4 mb-8">Page not found</p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-lg font-mono font-bold text-sm bg-ev-purple hover:brightness-110 transition-all inline-block"
          style={{ color: '#fff', boxShadow: '0 0 20px rgba(124, 106, 247, 0.3)' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
