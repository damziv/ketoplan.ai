export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <picture>
          <source srcSet="/images/keto-bg-desktop.png" media="(min-width: 768px)" />
          <img src="/images/keto-bg-mobile.png" alt="Avocados Background" className="w-full h-full object-cover" />
        </picture>
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center px-6 md:px-0">
        <h1 className="text-black text-5xl md:text-6xl font-extrabold leading-tight mb-4">
          Start Losing Weight <br /> Within Days
        </h1>
        <p className="text-black text-lg md:text-xl font-medium mb-6 max-w-xl mx-auto">
          Discover personalized meal plans tailored to your preferences and lifestyle.
        </p>

        <button
          onClick={() => window.location.href = '/quiz/1'}
          className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-transform transform hover:scale-105"
        >
          Start Quiz
        </button>
      </div>

      {/* ✅ Footer */}
      <footer className="relative z-10 w-full bg-gray-900 text-gray-300 text-sm text-center py-6 mt-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-gray-400">© {new Date().getFullYear()} AImealPrep. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="/cookie-policy" className="hover:text-white transition">Cookie Policy</a>
            <a href="/refund-policy" className="hover:text-white transition">Refund Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
