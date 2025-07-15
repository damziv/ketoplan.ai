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

const steps = [
  { id: 1, type: 'question', multiple: false },
  { id: 2, type: 'question', multiple: false },
  { id: 3, type: 'question', multiple: false },
  { id: 4, type: 'info1', contentKey: 'trustBlock1' },
  { id: 5, type: 'question', multiple: true },
  { id: 6, type: 'question', multiple: true },
  { id: 7, type: 'question', multiple: false },
  { id: 8, type: 'info2', contentKey: 'preEmailWarmup' },
  { id: 9, type: 'question', multiple: false },
  { id: 10, type: 'question', multiple: false },
  { id: 11, type: 'question', multiple: false },
  { id: 12, type: 'info3', contentKey: 'beforeFinalPush' },
  { id: 13, type: 'question', multiple: false }
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
  const currentStep = steps[stepIndex];

  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('sessionId');

    const loadSavedAnswers = async (id) => {
      const { data, error } = await supabase.from('sessions').select('quiz_answers').eq('id', id).single();
      if (error) console.error('❌ Failed to load saved answers:', error);
      else if (data?.quiz_answers) setAnswers(data.quiz_answers);
    };

    const createNewSession = async () => {
      const { data, error } = await supabase.from('sessions').insert({}).select('id').single();
      if (error) console.error('❌ Error creating new session:', error);
      else {
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
    if (sessionId) sessionStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  const saveAnswersToDatabase = async () => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ quiz_answers: answers }).eq('id', sessionId);
    if (error) console.error('Error saving answers:', error);
  };

  const handleAnswer = async (selected) => {
    const currentAnswers = answers[step] || [];
    let updatedAnswers;

    if (currentStep.multiple) {
      updatedAnswers = currentAnswers.includes(selected)
        ? currentAnswers.filter((a) => a !== selected)
        : [...currentAnswers, selected];
      setAnswers({ ...answers, [step]: updatedAnswers });
    } else {
      updatedAnswers = [selected];
      const newAnswers = { ...answers, [step]: updatedAnswers };
      setAnswers(newAnswers);
      await supabase.from('sessions').update({ quiz_answers: newAnswers }).eq('id', sessionId);

      if (stepIndex < steps.length - 1) router.push(`/quiz/${stepIndex + 2}`);
      else {
        sessionStorage.setItem('quizAnswers', JSON.stringify(newAnswers));
        router.push('/preview');
      }
    }
  };

  const handleNext = async () => {
    await saveAnswersToDatabase();
    if (stepIndex < steps.length - 1) router.push(`/quiz/${stepIndex + 2}`);
    else router.push('/preview');
  };

  const handleBack = () => {
    if (stepIndex > 0) router.push(`/quiz/${stepIndex}`);
  };

  if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
    return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">⚠️ Invalid step index.</div>;
  }

  {/* INFO1 SECTION */}
  {/* INFO1 SECTION*/}
  if (currentStep.type === 'info1') {
    return (
<div className="min-h-screen flex flex-col items-center justify-between px-4 pt-16 pb-36 relative bg-white text-gray-800">
  <div className="max-w-2xl w-full mt-8 space-y-6 text-left">
          <img src="/images/logo.jpg" alt="logo" className="w-32 mx-auto" />
  
          <h2 className="text-3xl font-bold">{t(`${currentStep.contentKey}.title`)}</h2>
          <p className="text-md">{t(`${currentStep.contentKey}.body1`)}</p>
          <p className="text-md">{t(`${currentStep.contentKey}.body2`)}</p>
  
          <h3 className="text-xl font-semibold mt-6">{t(`${currentStep.contentKey}.benefitsTitle`)}</h3>
          <ul className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 18 18" className="mt-1">
                  <circle cx="9" cy="9" r="9" fill="#03CEA4" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z"
                    fill="white"
                  />
                </svg>
                <span>{t(`${currentStep.contentKey}.benefit_${i}`)}</span>
              </li>
            ))}
          </ul>
  
          <div className="text-center mt-4">
            <a
              className="text-blue-600 underline text-sm"
              href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5959807/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(`${currentStep.contentKey}.linkText`)}
            </a>
          </div>
        </div>
  
        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 w-full bg-white px-4 py-4 border-t shadow z-50">
          <div className="max-w-md mx-auto">
            <button
              className="bg-green-500 w-full text-white py-3 rounded-md hover:bg-green-600"
              onClick={handleNext}
            >
              {t('next')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  {/* INFO2 SECTION */}
  {/* INFO2 SECTION*/}
  if (currentStep.type === 'info2') {
    return (
<div className="min-h-screen flex flex-col items-center justify-between px-4 pt-16 pb-36 relative bg-white text-gray-800">
  <div className="max-w-2xl w-full mt-8 space-y-6 text-left">
          <picture>
            <source
              type="image/webp"
              srcSet="/images/naturalfix-womangroup.jpg"
              sizes="100vw"
            />
            <img
              src="/images/naturalfix-womangroup.jpg"
              alt="Transformation"
              className="w-full h-auto object-contain rounded-lg shadow-xl"
            />
          </picture>
        </div>
  
        <h2 className="text-3xl font-bold text-green-700 mb-4">
          {t(`${currentStep.contentKey}.title`)} {/* e.g., "You are going to do great!" */}
        </h2>
  
        <p className="text-gray-800 text-base mb-6 max-w-md">
          {t(`${currentStep.contentKey}.subtitle`)} {/* e.g., "We have already helped 529,332 people..." */}
        </p>
  
        <button
          className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 shadow-md"
          onClick={handleNext}
        >
          {t('next')}
        </button>
      </div>
    );
  }
  
  {/* INFO3 SECTION */}
  {/* INFO3 SECTION*/}
 if (currentStep.type === 'info3') {
  return (
<div className="min-h-screen flex flex-col items-center justify-between px-4 pt-16 pb-36 relative bg-white text-gray-800">
  <div className="max-w-2xl w-full mt-8 space-y-6 text-left">
        <h2 className="text-3xl font-bold text-center text-green-700 mb-8">
        {t(`${currentStep.contentKey}.title`)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="text-left space-y-4">
            <p className="text-gray-800 text-base">
            {t(`${currentStep.contentKey}.bodyText1`)}
            </p>
            <p className="text-gray-800 text-base">
            {t(`${currentStep.contentKey}.bodyText2`)}
            </p>
          </div>

          <div className="w-full">
            <picture>
              <source
                type="image/webp"
                srcSet="/images/naturalfix-before-after.png"
              />
              <img
                src="/images/naturalfix-before-after.png"
                alt="Before and After"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </picture>
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            className="bg-green-500 text-white py-3 px-8 rounded-md hover:bg-green-600 text-lg font-semibold shadow-lg"
            onClick={handleNext}
          >
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}


  const questionsArray = t('questions', { returnObjects: true }) || [];
  const questionIndex = steps.slice(0, stepIndex + 1).filter(s => s.type === 'question').length - 1;
  const question = questionsArray[questionIndex];

  if (!question || !question.options || !Array.isArray(question.options)) {
    return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 font-semibold text-center px-4">⚠️ Invalid question config.</div>;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 md:px-0 pb-36 overflow-visible">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">{t('topTitle')}</div>
      <div className="fixed top-14 w-full z-50">
        <ProgressBar
          currentStep={steps.slice(0, stepIndex + 1).filter(s => s.type === 'question').length}
          totalSteps={steps.filter(s => s.type === 'question').length}
        />
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
                {foodImage && <img src={foodImage} alt={option} className="h-8 w-8 mr-4" />}
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {currentStep.multiple && (
        <div className="sticky bottom-0 overflow-visible left-0 w-full bg-white px-4 py-3 border-t shadow-md z-1000">
          <div className="max-w-md mx-auto flex justify-between">
            <button className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600" onClick={handleBack}>{t('back')}</button>
            <button className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600" onClick={handleNext}>{t('next')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  const stepsCount = 13;
  const steps = Array.from({ length: stepsCount }, (_, i) => i + 1);
  const paths = ['en', 'hr', 'de'].flatMap((locale) =>
    steps.map((step) => ({ params: { step: step.toString() }, locale }))
  );
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['quiz'])),
    },
  };
}
