import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Loader2, 
  Apple, 
  Scale, 
  Dumbbell, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Droplets,
  Calculator,
  User
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from "jspdf";

interface DietPlan {
  plan: string;
}

export default function DietPlanner() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    activityLevel: 'Moderate',
    healthGoal: 'General Healthy Lifestyle',
    medicalConditions: [] as string[],
    foodPreference: 'Vegetarian',
    allergies: '',
    avoidFoods: '',
    mealsCount: '4'
  });

  const medicalConditionsOptions = [
    'Diabetes', 'Hypertension', 'Thyroid', 'Cholesterol', 'None'
  ];

  const handleConditionToggle = (condition: string) => {
    setFormData(prev => {
      if (condition === 'None') return { ...prev, medicalConditions: ['None'] };
      const newConditions = prev.medicalConditions.filter(c => c !== 'None');
      if (newConditions.includes(condition)) {
        return { ...prev, medicalConditions: newConditions.filter(c => c !== condition) };
      } else {
        return { ...prev, medicalConditions: [...newConditions, condition] };
      }
    });
  };

  const generateDietPlan = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Generate a highly personalized weekly diet plan (7 days) for a user with the following profile:
      - Age: ${formData.age}
      - Gender: ${formData.gender}
      - Height: ${formData.height} cm
      - Weight: ${formData.weight} kg
      - Activity Level: ${formData.activityLevel}
      - Health Goal: ${formData.healthGoal}
      - Medical Conditions: ${formData.medicalConditions.join(', ')}
      - Food Preference: ${formData.foodPreference}
      - Allergies: ${formData.allergies || 'None'}
      - Foods to Avoid: ${formData.avoidFoods || 'None'}
      - Daily Meals Count: ${formData.mealsCount}

      Please provide a detailed table for each day.
      The table MUST have the following columns: | Meal | Timing | Description | Portion Size | Calories |
      
      Structure for each day:
      ### Day X: [Catchy Name]
      [Table here]
      **Daily Total:** [Calories] | **Macros:** [P/C/F Balance]
      
      Include:
      1. Breakfast, Mid-morning snack, Lunch, Evening snack, Dinner (adjust based on ${formData.mealsCount} meals).
      2. Specific timing for each meal (e.g., 08:00 AM, 01:30 PM).
      3. Detailed description of the food.
      4. Portion sizes (e.g., 1 bowl, 200g, 2 slices).
      5. Calorie estimation for each meal.
      6. Hydration advice specific to their profile.
      7. Important tips for their specific medical conditions if any.

      Format the output in clear Markdown using GFM (GitHub Flavored Markdown) tables. Ensure the tables are valid and well-formatted. Use emojis to make it visually appealing.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      setGeneratedPlan(response.text || "Failed to generate plan.");
      setStep(3);
    } catch (error) {
      console.error("Diet Plan Error:", error);
      alert("Failed to generate diet plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedPlan) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(generatedPlan.replace(/[#*]/g, ''), 180);
    doc.setFontSize(12);
    doc.text("Personalized Smart Diet Plan", 10, 10);
    doc.setFontSize(10);
    doc.text(splitText, 10, 20);
    doc.save("MediGuard_Diet_Plan.pdf");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Utensils className="w-8 h-8 text-emerald-600" />
            Smart Diet Planner
          </h1>
          <p className="text-slate-500 mt-1">AI-powered personalized nutrition based on your health profile.</p>
        </div>
        {step === 3 && (
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        )}
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex gap-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s ? 'bg-emerald-600 text-white shadow-md' : 
                  step > s ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                <span className={`text-sm font-medium ${step === s ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {s === 1 ? 'Personal Info' : s === 2 ? 'Goals & Preferences' : 'Your Plan'}
                </span>
              </div>
            ))}
          </div>
          {step < 3 && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 2</span>
          )}
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" /> Age
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 28"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Gender</label>
                    <div className="flex gap-2">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button
                          key={g}
                          onClick={() => setFormData({...formData, gender: g})}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            formData.gender === g ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" /> Height (cm)
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 175"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-emerald-600" /> Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 70"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-600" /> Activity Level
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Sedentary', 'Moderate', 'Active'].map(level => (
                      <button
                        key={level}
                        onClick={() => setFormData({...formData, activityLevel: level})}
                        className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                          formData.activityLevel === level 
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                            : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200'
                        }`}
                      >
                        {level}
                        <p className="text-[10px] font-normal mt-1 opacity-70">
                          {level === 'Sedentary' ? 'Little to no exercise' : 
                           level === 'Moderate' ? '3-5 days/week' : 'Daily intense exercise'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.age || !formData.height || !formData.weight}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Apple className="w-4 h-4 text-emerald-600" /> Health Goal
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                      value={formData.healthGoal}
                      onChange={(e) => setFormData({...formData, healthGoal: e.target.value})}
                    >
                      {['Weight Loss', 'Weight Gain', 'Muscle Gain', 'Diabetic Diet', 'Heart Healthy Diet', 'PCOS Diet', 'General Healthy Lifestyle'].map(goal => (
                        <option key={goal} value={goal}>{goal}</option>
                      ))}
                    </select>

                    <label className="text-sm font-bold text-slate-700 block mt-6">Medical Conditions</label>
                    <div className="flex flex-wrap gap-2">
                      {medicalConditionsOptions.map(condition => (
                        <button
                          key={condition}
                          onClick={() => handleConditionToggle(condition)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                            formData.medicalConditions.includes(condition)
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>

                    <label className="text-sm font-bold text-slate-700 block mt-6">Food Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].map(pref => (
                        <button
                          key={pref}
                          onClick={() => setFormData({...formData, foodPreference: pref})}
                          className={`py-3 rounded-xl text-xs font-bold transition-all ${
                            formData.foodPreference === pref ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Allergies</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Peanuts, Dairy"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.allergies}
                        onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Foods to Avoid</label>
                      <input 
                        type="text" 
                        placeholder="e.g. High sugar, Fried foods"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.avoidFoods}
                        onChange={(e) => setFormData({...formData, avoidFoods: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" /> Daily Meals Count
                      </label>
                      <div className="flex gap-2">
                        {['3', '4', '5', '6'].map(count => (
                          <button
                            key={count}
                            onClick={() => setFormData({...formData, mealsCount: count})}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                              formData.mealsCount === count ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-6 py-4 text-slate-500 font-bold hover:text-slate-800 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button 
                    onClick={generateDietPlan}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" />
                        Generate Diet Plan
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && generatedPlan && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">Your Personalized Plan is Ready!</h3>
                    <p className="text-emerald-700 text-sm mt-1">Based on your health profile, our AI has crafted a balanced weekly nutrition guide.</p>
                  </div>
                </div>

                <div className="markdown-body bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPlan}</ReactMarkdown>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Edit Preferences
                  </button>
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">Medical Disclaimer</p>
          <p>This diet plan is generated by AI for educational purposes. It does not replace professional medical advice. Always consult with a registered dietitian or your doctor before starting a new diet, especially if you have underlying medical conditions.</p>
        </div>
      </div>
    </div>
  );
}
