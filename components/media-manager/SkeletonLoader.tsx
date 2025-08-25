export function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-48 bg-white/5 animate-pulse"></div>
          <div className="p-4">
            <div className="h-6 w-3/4 rounded bg-white/5 animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}