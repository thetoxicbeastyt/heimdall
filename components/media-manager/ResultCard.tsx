import Image from 'next/image';

interface ResultCardProps {
  result: {
    poster: string;
    title: string;
    year: number;
    quality: string;
    size: string;
    seeders: number;
  };
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-48">
        <Image src={result.poster} alt={result.title} fill className="object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-bold">{result.title} ({result.year})</h3>
        <div className="flex justify-between items-center mt-2 text-sm text-white/80">
          <span>{result.quality}</span>
          <span>{result.size}</span>
          <span>{result.seeders} seeders</span>
        </div>
      </div>
    </div>
  );
}