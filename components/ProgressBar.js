// Updated ProgressBar with Tailwind
export default function ProgressBar({ currentStep, totalSteps }) {
  const percentage = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full bg-gray-200 h-3 rounded-md my-5 relative">
      <div
        className="bg-blue-500 h-full rounded-md"
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="absolute inset-0 flex justify-between items-center text-xs px-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`${
              i + 1 === currentStep ? 'text-blue-600 font-bold' : 'text-gray-500'
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
