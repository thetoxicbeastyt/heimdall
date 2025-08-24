export default function HomePage() {
  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome to Heimdall
        </h1>
        <p className="text-white/70 text-lg">
          Your debrid media management hub
        </p>
      </div>

      {/* Module cards container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for module cards - will be added next */}
        <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-6 h-48 flex items-center justify-center">
          <p className="text-white/50 text-center">
            Module cards will be added here
          </p>
        </div>
      </div>
    </div>
  )
}