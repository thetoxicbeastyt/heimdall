import { ResultCard } from './ResultCard';

interface ResultsGridProps {
  results: any[];
}

export function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {results.map((result, index) => (
        <ResultCard key={index} result={result} />
      ))}
    </div>
  );
}