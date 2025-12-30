
export interface Habit {
  id: string;
  name: string;
  identity: string; // The "Who I want to be" (e.g., "I am a reader")
  cue: string;      // The signal
  easyVersion: string; // The 2-minute rule version
  stackingHabit?: string; // After [X], I will [Y]
  createdAt: number;
  color: string;
  category: 'Salud' | 'Productividad' | 'Aprendizaje' | 'Social' | 'Otros';
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
}

export interface AppState {
  habits: Habit[];
  logs: HabitLog[];
  userIdentity: string;
}
