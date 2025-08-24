'use client'

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
      />
      
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        {/* Primary animated orb */}
        <div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"
          style={{
            animationDelay: '0s'
          }}
        />
        
        {/* Secondary animated orb */}
        <div 
          className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"
          style={{
            animationDelay: '2s'
          }}
        />
        
        {/* Tertiary animated orb */}
        <div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"
          style={{
            animationDelay: '4s'
          }}
        />
      </div>
      
      {/* Subtle noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}