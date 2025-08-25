export function EmptyState() {
  return (
    <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-lg shadow-lg mt-4">
      <h3 className="text-xl font-bold">No results found</h3>
      <p className="text-white/80">Try a different search term.</p>
    </div>
  );
}