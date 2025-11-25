import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, Priority } from "../types";

export const generateProjectTasks = async (projectDescription: string, projectType: string): Promise<Task[]> => {
  // Safe access to API Key
  let apiKey: string | undefined;
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env.API_KEY === 'string') {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("process.env access failed");
  }

  // Fallback if no API key is present
  if (!apiKey) {
    console.warn("No API Key found or invalid. Using fallback mock data.");
    return simulateAiResponse(projectDescription);
  }

  // Retry logic config
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        I am creating a project of type "${projectType}".
        The description is: "${projectDescription}".
        
        Please generate 5 to 8 suggested tasks for this project.
        Return a JSON array of task objects.
        Each task must have a "title" (string) and "priority" (High, Medium, Low).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
              },
              required: ["title", "priority"]
            }
          }
        }
      });

      const rawText = response.text;
      if (!rawText) throw new Error("Empty response from AI");

      let rawTasks: any[] = [];
      
      try {
        rawTasks = JSON.parse(rawText);
      } catch (jsonError) {
        console.warn(`JSON Parse failed on attempt ${attempt + 1}`, jsonError);
        throw new Error("Malformed JSON received");
      }

      // Basic validation
      if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
        throw new Error("Empty or invalid task array received");
      }

      // Transform into App Task Type
      return rawTasks.map((t: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        title: t.title || "Untitled Task",
        status: TaskStatus.TODO,
        priority: (["High", "Medium", "Low"].includes(t.priority) ? t.priority : "Medium") as Priority,
        dueDate: new Date(Date.now() + 86400000 * (index + 1)).toISOString().split('T')[0], // staggered dates
        comments: []
      }));

    } catch (error) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      attempt++;
      if (attempt >= MAX_RETRIES) {
        // If all retries fail, fall back to simulation
        console.warn("Max retries reached. Falling back to simulation.");
        return simulateAiResponse(projectDescription);
      }
      // Simple exponential backoff
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
    }
  }
  
  return simulateAiResponse(projectDescription);
};

// Fallback simulation for demo purposes
const simulateAiResponse = (desc: string): Task[] => {
  return [
    { id: 'sim-1', title: 'Initial Project Setup', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: new Date().toISOString().split('T')[0], comments: [] },
    { id: 'sim-2', title: 'Research & Analysis', status: TaskStatus.TODO, priority: Priority.MEDIUM, comments: [] },
    { id: 'sim-3', title: 'Draft Requirements', status: TaskStatus.TODO, priority: Priority.HIGH, comments: [] },
    { id: 'sim-4', title: 'Team Kickoff Meeting', status: TaskStatus.TODO, priority: Priority.MEDIUM, comments: [] },
    { id: 'sim-5', title: 'Review Milestone 1', status: TaskStatus.TODO, priority: Priority.LOW, comments: [] },
  ];
}