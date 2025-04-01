import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ProgressBar from '../../components/ProgressBar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
 
// Multi-language food mapping
const foodTranslationMap = {
  // English
  "chicken": "chicken", "pork": "pork", "beef": "beef", "bacon": "bacon", "salmon": "salmon", "tuna": "tuna", "lamb": "lamb",
  "broccoli": "broccoli", "spinach": "spinach", "lettuce": "lettuce", "cauliflower": "cauliflower", "cabbage": "cabbage", 
  "zucchini": "zucchini", "asparagus": "asparagus", "eggplant": "eggplant", "eggs": "eggs", "cheese": "cheese", 
  "butter": "butter", "tofu": "tofu", "shrimp": "shrimp", "chia": "chia",
  "nothing": "none", "none": "none",

  // Croatian (Hrvatski)
  "piletina": "chicken", "svinjetina": "pork", "govedina": "beef", "slanina": "bacon", "losos": "salmon", "tuna": "tuna", "janjetina": "lamb",
  "brokula": "broccoli", "špinat": "spinach", "zelena salata": "lettuce", "cvjetača": "cauliflower", "kupus": "cabbage", 
  "tikvica": "zucchini", "šparoge": "asparagus", "patlidžan": "eggplant", "jaja": "eggs", "sir": "cheese", 
  "maslac": "butter", "tofu": "tofu", "škampi": "shrimp", "chia": "chia",
  "ništa": "none", "niti jedno": "none",

  // German (Deutsch)
  "huhn": "chicken", "schweinefleisch": "pork", "rindfleisch": "beef", "speck": "bacon", "lachs": "salmon", "thunfisch": "tuna", "lamm": "lamb",
  "brokkoli": "broccoli", "spinat": "spinach", "kopfsalat": "lettuce", "blumenkohl": "cauliflower", "kohl": "cabbage", 
  "zucchini": "zucchini", "spargel": "asparagus", "aubergine": "eggplant", "eier": "eggs", "käse": "cheese", 
  "butter": "butter", "tofu": "tofu", "garnelen": "shrimp", "chia": "chia",
  "keine": "none", "nichts": "none",

  // Polish (Polski)
  "kurczak": "chicken", "wieprzowina": "pork", "wołowina": "beef", "bekon": "bacon", "łosoś": "salmon", "tuńczyk": "tuna", "jagnięcina": "lamb",
  "brokuły": "broccoli", "szpinak": "spinach", "sałata": "lettuce", "kalafior": "cauliflower", "kapusta": "cabbage", 
  "cukinia": "zucchini", "szparagi": "asparagus", "bakłażan": "eggplant", "jajka": "eggs", "ser": "cheese", 
  "masło": "butter", "tofu": "tofu", "krewetki": "shrimp", "chia": "chia",
  "żadne": "none", "nic": "none",

  // Czech (Čeština)
  "kuře": "chicken", "vepřové": "pork", "hovězí": "beef", "slanina": "bacon", "losos": "salmon", "tuňák": "tuna", "jehněčí": "lamb",
  "brokolice": "broccoli", "špenát": "spinach", "salát": "lettuce", "květák": "cauliflower", "zelí": "cabbage", 
  "cuketa": "zucchini", "chřest": "asparagus", "lilek": "eggplant", "vejce": "eggs", "sýr": "cheese", 
  "máslo": "butter", "tofu": "tofu", "krevety": "shrimp", "chia": "chia",
  "žádné": "none", "nic": "none"
};


const questions = [
  { id: 1, question: 'What is your gender?', options: ['Male', 'Female', 'Other'], multiple: false },
  { id: 2, question: 'How much variety do you want in your meal plan?', options: ['High', 'Moderate', 'Low'], multiple: false },
  { id: 3, question: 'Choose the meat you want to include', options: ['Chicken', 'Pork', 'Beef', 'Bacon', 'Salmon', 'Tuna', 'Lamb', 'None'], multiple: true },
  { id: 4, question: 'Choose the vegetable you want to include', options: ['Broccoli', 'Spinach', 'Lettuce', 'Cauliflower', 'Cabbage', 'Zucchini', 'Asparagus', 'Eggplant', 'None'], multiple: true },
  { id: 5, question: 'Choose another products you want to include', options: ['Eggs', 'Cheese', 'Butter', 'Tofu', 'Shrimp', 'Chia', 'None'], multiple: true },
  { id: 6, question: 'What is your activity level?', options: ['Sedentary', 'Moderately Active', 'Very Active'], multiple: false },
  { id: 7, question: 'Do you have any allergies?', options: ['Nuts', 'Dairy', 'Soy', 'None'], multiple: true },
  { id: 8, question: 'What is your primary goal?', options: ['Weight Loss', 'Maintain Weight', 'Gain Muscle'], multiple: false },
  { id: 9, question: 'Do you have a budget preference for meal prep?', options: ['Low', 'Medium', 'High'], multiple: false },
  { id: 10, question: 'Do you snack frequently?', options: ['Yes', 'No'], multiple: false },
  { id: 11, question: 'What is your preferred cooking time?', options: ['<30 minutes', '30-60 minutes', '>60 minutes'], multiple: false },
  { id: 12, question: 'What motivest you the most?', options: ['Family & Loved Ones', 'Self-Improvement', 'Health Goals', 'Increased Energy', 'None'], multiple: false },
];

export default function QuizStep() {
  const router = useRouter();
  const { step } = router.query;
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
      sessionStorage.setItem('sessionId', data.id); // ✅ Store session ID once
      setSessionId(data.id);
    }
  };

  const saveAnswersToDatabase = async () => {
    if (!sessionId) {
      console.error('No session ID. Cannot save answers.');
      return;
    }

    const { error } = await supabase
      .from('sessions')
      .update({ quiz_answers: answers })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving answers:', error);
    }
  };

  const handleAnswer = (selected) => {
    const currentAnswers = answers[step] || [];
    let updatedAnswers;

    if (questions[step - 1].multiple) {
      updatedAnswers = currentAnswers.includes(selected)
        ? currentAnswers.filter((answer) => answer !== selected)
        : [...currentAnswers, selected];
    } else {
      updatedAnswers = [selected];
      handleNext();
    }

    setAnswers({ ...answers, [step]: updatedAnswers });
  };

  const handleNext = async () => {
    await saveAnswersToDatabase();
    if (parseInt(step) < questions.length) {
      router.push(`/quiz/${parseInt(step) + 1}`);
    } else {
      router.push('/email');
    }
  };

  const handleBack = () => {
    if (parseInt(step) > 1) {
      router.push(`/quiz/${parseInt(step) - 1}`);
    }
  };

  const getFoodImage = (option) => {
    const normalizedOption = option.toLowerCase();
    const englishFoodName = foodTranslationMap[normalizedOption] || normalizedOption;
    return Object.values(foodTranslationMap).includes(englishFoodName) ? `/images/assets/${englishFoodName}.png` : null;
  };

  const question = questions[parseInt(step) - 1];

  if (!question) return <div>Loading...</div>;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 md:px-0">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">AImealPrep</div>
      <div className="fixed top-14 w-full z-50"><ProgressBar currentStep={parseInt(step)} totalSteps={questions.length} /></div>
      <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-lg shadow-md w-full max-w-md text-center mt-24">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{question.question}</h2>
        <p className="text-gray-700 text-sm mb-4">Select your preference</p>
        <div className="flex flex-col space-y-4">
          {question.options.map((option) => {
            const foodImage = getFoodImage(option);
            return (
              <button
                key={option}
                className={`flex items-center p-6 rounded-lg text-lg transition-all duration-300 shadow-lg border-2 border-transparent hover:border-green-500 w-full ${
                  answers[step]?.includes(option) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        {question.multiple && (
          <div className="flex justify-between w-full mt-5">
            <button
              className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600"
              onClick={handleBack}
              disabled={parseInt(step) === 1}
            >
              Back
            </button>
            <button
              className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600"
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
