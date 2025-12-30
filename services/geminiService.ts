
import { GoogleGenAI } from "@google/genai";
import { Habit, HabitLog } from "../types";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates initial advice for a new habit.
 */
export const getHabitAdvice = async (habitName: string, identity: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como un experto en el libro "Hábitos Atómicos" de James Clear. 
      Tengo un usuario que quiere implementar el hábito: "${habitName}" para reforzar su identidad de: "${identity}".
      
      Por favor, genera un consejo breve (máximo 3 oraciones) que incluya:
      1. Una estrategia de "Apilamiento de Hábitos" (Habit Stacking).
      2. Una versión de 2 minutos para este hábito.
      3. Una forma de diseñar su ambiente para que sea obvio.
      
      Responde de forma inspiradora y directa en español.`,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini advice:", error);
    return "Recuerda: Los pequeños cambios generan grandes diferencias. Enfócate en tu sistema hoy.";
  }
};

/**
 * Analyzes the user's progress and provides a "System Audit".
 */
export const getSystemAudit = async (habits: Habit[], logs: HabitLog[]) => {
  try {
    const habitSummary = habits.map(h => {
      const completionCount = logs.filter(l => l.habitId === h.id && l.completed).length;
      return `- Hábito: ${h.name}, Identidad: ${h.identity}, Completado ${completionCount} veces recientemente.`;
    }).join('\n');

    const prompt = `Actúa como James Clear. Analiza el progreso actual de mi sistema de hábitos:
    
    ${habitSummary}
    
    Basado en los principios de "Hábitos Atómicos", proporciona un "Auditoría del Sistema" breve. 
    Dime qué estoy haciendo bien, dónde podría haber fricción y una sugerencia táctica para ser 1% mejor mañana. 
    Sé motivador pero realista. Máximo 120 palabras.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching System Audit:", error);
    return "Tu sistema está en evolución. Mantén la consistencia y no rompas la cadena.";
  }
};
