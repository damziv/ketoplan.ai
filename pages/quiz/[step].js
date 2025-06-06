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

const questions = [
  { id: 1, multiple: false },
  { id: 2, multiple: false },
  { id: 3, multiple: false },
  { id: 4, multiple: true },
  { id: 5, multiple: true },
  { id: 6, multiple: true },
  { id: 7, multiple: false },
  { id: 8, multiple: false },
  { id: 9, multiple: false },
  { id: 10, multiple: false }
];

const foodTranslationMap = {
  "chicken": "chicken", "pork": "pork", "beef": "beef", "bacon": "bacon",
  "salmon": "salmon", "tuna": "tuna", "lamb": "lamb",
  "broccoli": "broccoli", "spinach": "spinach", "lettuce": "lettuce", "cauliflower": "cauliflower",
  "cabbage": "cabbage", "zucchini": "zucchini", "asparagus": "asparagus", "eggplant": "eggplant",
  "eggs": "eggs", "cheese": "cheese", "butter": "butter", "tofu": "tofu",
  "shrimp": "shrimp", "chia": "chia", "none": "none", "nothing": "none",
  "piletina": "chicken", "svinjetina": "pork", "govedina": "beef", "slanina": "bacon",
  "losos": "salmon", "tuna": "tuna", "janjetina": "lamb",
  "brokula": "broccoli", "špinat": "spinach", "zelena salata": "lettuce", "cvjetača": "cauliflower",
  "kupus": "cabbage", "tikvica": "zucchini", "šparoge": "asparagus", "patlidžan": "eggplant",
  "jaja": "eggs", "sir": "cheese", "maslac": "butter", "tofu": "tofu", "škampi": "shrimp", "chia": "chia",
  "ništa": "none", "niti jedno": "none",
  "hähnchen": "chicken", "schwein": "pork", "rind": "beef", "speck": "bacon",
  "lachs": "salmon", "thunfisch": "tuna", "lamm": "lamb",
  "brokkoli": "broccoli", "spinat": "spinach", "kopfsalat": "lettuce", "blumenkohl": "cauliflower",
  "kohl": "cabbage", "zucchini": "zucchini", "spargel": "asparagus", "aubergine": "eggplant",
  "eier": "eggs", "käse": "cheese", "butter": "butter", "tofu": "tofu",
  "garnelen": "shrimp", "chia": "chia",
  "keines": "none", "keine": "none",
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

  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('sessionId');

    const loadSavedAnswers = async (id) => {
      const { data, error } = await supabase
        .from('sessions')
        .select('quiz_answers')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Failed to load saved answers:', error);
      } else if (data?.quiz_answers) {
        setAnswers(data.quiz_answers);
      }
    };

    const createNewSession = async () => {
      const { data, error } = await supabase.from('sessions').insert({}).select('id').single();
      if (error) {
        console.error('❌ Error creating new session:', error);
      } else {
        sessionStorage.setItem('sessionId', data.id);
        setSessionId(data.id);
      }
    };

    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadSavedAnswers(storedSessionId);
    } else {
      createNewSession();
    }

    if (step === '1' && typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'StartQuiz');
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const saveAnswersToDatabase = async () => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ quiz_answers: answers }).eq('id', sessionId);
    if (error) console.error('Error saving answers:', error);
  };

  const handleAnswer = async (selected) => {
    const currentAnswers = answers[step] || [];
    let updatedAnswers;
  
    if (questions[stepIndex].multiple) {
      updatedAnswers = currentAnswers.includes(selected)
        ? currentAnswers.filter((a) => a !== selected)
        : [...currentAnswers, selected];
      setAnswers({ ...answers, [step]: updatedAnswers });
    } else {
      updatedAnswers = [selected];
      const newAnswers = { ...answers, [step]: updatedAnswers };
      setAnswers(newAnswers);
  
      await supabase
        .from('sessions')
        .update({ quiz_answers: newAnswers })
        .eq('id', sessionId);
  
      if (stepIndex < questions.length - 1) {
        router.push(`/quiz/${stepIndex + 2}`);
      } else {
        router.push('/preview');
      }
    }
  };

  const handleNext = async () => {
    await saveAnswersToDatabase();
    if (stepIndex < questions.length - 1) {
      router.push(`/quiz/${stepIndex + 2}`);
    } else {
      router.push('/preview');
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      router.push(`/quiz/${stepIndex}`);
    }
  };

  const questionsArray = t('questions', { returnObjects: true }) || [];
  const question = questionsArray[stepIndex];

  if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">
        ⚠️ Invalid step index. Please restart the quiz.
      </div>
    );
  }

  if (!question || !question.options || !Array.isArray(question.options)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">
        ⚠️ Error: Missing or invalid translation for this question. Please check quiz.json.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 md:px-0 pb-36 overflow-visible">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">{t('topTitle')}</div>
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
      </div>

      {questions[stepIndex].multiple && (
        <div className="sticky bottom-0 overflow-visible left-0 w-full bg-white px-4 py-3 border-t shadow-md z-1000">
          <div className="max-w-md mx-auto flex justify-between">
            <button
              className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600"
              onClick={handleBack}
            >
              {t('back')}
            </button>
            <button
              className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600"
              onClick={handleNext}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  const steps = Array.from({ length: 12 }, (_, i) => i + 1);

  const paths = ['en', 'hr', 'de'].flatMap((locale) =>
    steps.map((step) => ({
      params: { step: step.toString() },
      locale,
    }))
  );

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['quiz'])),
    },
  };
}
