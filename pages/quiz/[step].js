// ✅ pages/quiz/[step].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ProgressBar from '../../components/ProgressBar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Metadata only (not translatable)
const questions = [
  { id: 1, multiple: false },
  { id: 2, multiple: false },
  { id: 3, multiple: true },
  { id: 4, multiple: true },
  { id: 5, multiple: true },
  { id: 6, multiple: false },
  { id: 7, multiple: true },
  { id: 8, multiple: false },
  { id: 9, multiple: false },
  { id: 10, multiple: false },
  { id: 11, multiple: false },
  { id: 12, multiple: false }
];

const foodTranslationMap = {
  "chicken": "chicken", "pork": "pork", "beef": "beef", "bacon": "bacon", "salmon": "salmon", "tuna": "tuna", "lamb": "lamb",
  "broccoli": "broccoli", "spinach": "spinach", "lettuce": "lettuce", "cauliflower": "cauliflower", "cabbage": "cabbage",
  "zucchini": "zucchini", "asparagus": "asparagus", "eggplant": "eggplant", "eggs": "eggs", "cheese": "cheese",
  "butter": "butter", "tofu": "tofu", "shrimp": "shrimp", "chia": "chia",
  "nothing": "none", "none": "none",
  "piletina": "chicken", "svinjetina": "pork", "govedina": "beef", "slanina": "bacon", "losos": "salmon", "tuna": "tuna", "janjetina": "lamb",
  "brokula": "broccoli", "špinat": "spinach", "zelena salata": "lettuce", "cvjetača": "cauliflower", "kupus": "cabbage",
  "tikvica": "zucchini", "šparoge": "asparagus", "patlidžan": "eggplant", "jaja": "eggs", "sir": "cheese",
  "maslac": "butter", "tofu": "tofu", "škampi": "shrimp", "chia": "chia",
  "ništa": "none", "niti jedno": "none"
};

const getFoodImage = (option) => {
  const normalizedOption = option.toLowerCase();
  const englishFoodName = foodTranslationMap[normalizedOption] || normalizedOption;
  return Object.values(foodTranslationMap).includes(englishFoodName)
    ? `/images/assets/${englishFoodName}.png`
    : null;
};

export default function QuizStep() {
  const { t } = useTranslation('quiz');
  const router = useRouter();
  const { step } = router.query;
  const stepIndex = parseInt(step) - 1;
  
  if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">
        ⚠️ Invalid step index. Please restart the quiz.
      </div>
    );
  }
  const questionsArray = t('questions', { returnObjects: true }) || [];
  const question = questionsArray[stepIndex];
  
  console.log("🌐 stepIndex:", stepIndex);
  console.log("🧪 Full quiz translation object:", t('', { returnObjects: true }));
  console.log("🈶 Loaded question from t:", question);
  const questionMeta = questions[stepIndex];

  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('SessionId');
    if (!storedSessionId) {
      createNewSession();
    } else {
      setSessionId(storedSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const createNewSession = async () => {
    const { data, error } = await supabase.from('sessions').insert({}).select('id').single();
    if (error) {
      console.error('Error creating new session:', error);
    } else {
      sessionStorage.setItem('sessionId', data.id);
      setSessionId(data.id);
    }
  };

  const saveAnswersToDatabase = async () => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ quiz_answers: answers }).eq('id', sessionId);
    if (error) console.error('Error saving answers:', error);
  };

  const handleAnswer = (selected) => {
    const currentAnswers = answers[step] || [];
    let updatedAnswers;

    if (questionMeta.multiple) {
      updatedAnswers = currentAnswers.includes(selected)
        ? currentAnswers.filter((a) => a !== selected)
        : [...currentAnswers, selected];
    } else {
      updatedAnswers = [selected];
      handleNext();
    }

    setAnswers({ ...answers, [step]: updatedAnswers });
  };

  const handleNext = async () => {
    await saveAnswersToDatabase();
    if (stepIndex < questions.length - 1) {
      router.push(`/quiz/${stepIndex + 2}`);
    } else {
      router.push('/email');
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      router.push(`/quiz/${stepIndex}`);
    }
  };

  if (!question) return <div>Loading...</div>;


  if (!step || !question) {
    return <div className="text-center py-10 text-gray-700">Loading quiz...</div>;
  }
  
  if (!question.options || !Array.isArray(question.options)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">
        ⚠️ Error: Missing or invalid translation for this question. Please check quiz.json.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 md:px-0">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">Smart Keto-Meal</div>
      <div className="fixed top-14 w-full z-50">
        <ProgressBar currentStep={stepIndex + 1} totalSteps={questions.length} />
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-lg shadow-md w-full max-w-md text-center mt-24">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{question.question}</h2>
        <p className="text-gray-700 text-sm mb-4">{t('selectYourPreference')}</p>



        <div className="flex flex-col space-y-4">
          
          {question.options.map((option, index) => {
            const foodImage = getFoodImage(option);
            return (
              <button
                key={index}
                className={`flex items-center p-6 rounded-lg text-lg transition-all duration-300 shadow-lg border-2 border-transparent hover:border-green-500 w-full ${
                  answers[step]?.includes(option)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleAnswer(option)}
              >
                {foodImage && (
                  <img src={foodImage} alt={option} className="h-8 w-8 mr-4" />
                )}
                {option}
              </button>
            );
          })}
        </div>

        {questionMeta.multiple && (
          <div className="flex justify-between w-full mt-5">
            <button className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600" onClick={handleBack}>
              {t('back')}
            </button>
            <button className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600" onClick={handleNext}>
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  console.log('📣 Detected locale (SSR):', locale);
  return {
    props: {
      ...(await serverSideTranslations(locale, ['quiz'])),
    },
  };
}