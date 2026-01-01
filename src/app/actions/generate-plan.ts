
'use server';

import { db } from '@/lib/firebaseAdmin';
import { generateStudyTasksForTopic } from '@/ai/flows/generate-study-tasks-flow';
import { addDays, differenceInDays, format } from 'date-fns';

// Define the shape of the input from the client
type TopicInput = {
  topic: string;
  difficulty: 'Easy' | 'Hard';
};

type ActionInput = {
  userId: string;
  testId: string;
  testName: string;
  testDate: Date;
  availableStudyDays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  topics: TopicInput[];
};

type ActionResult = {
  success: boolean;
  error?: string;
  planId?: string;
};

const DAY_MAP: { [key: string]: number } = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

/**
 * Generates and saves a detailed, adaptive study plan.
 */
export async function generateAndSaveStudyPlan(input: ActionInput): Promise<ActionResult> {
  const { userId, testId, testName, testDate, availableStudyDays, topics } = input;

  try {
    // 1. DETERMINISTIC LOGIC: Calculate study dates
    const today = new Date();
    const totalDays = differenceInDays(testDate, today);
    if (totalDays < 1) {
      return { success: false, error: "Test date must be in the future." };
    }

    const availableDayNumbers = availableStudyDays.map(day => DAY_MAP[day]);
    const studyDates: Date[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = addDays(today, i);
      if (availableDayNumbers.includes(currentDate.getDay())) {
        studyDates.push(currentDate);
      }
    }

    if (studyDates.length === 0) {
        return { success: false, error: "No available study days found between now and the test date." };
    }

    // 2. DETERMINISTIC LOGIC: Weighted Distribution
    const easyTopics = topics.filter(t => t.difficulty === 'Easy');
    const hardTopics = topics.filter(t => t.difficulty === 'Hard');
    const totalWeight = easyTopics.length * 1 + hardTopics.length * 2;

    const daysPerWeight = studyDates.length / totalWeight;

    const topicSchedule: { topic: string, dates: Date[] }[] = [];
    let dateIndex = 0;

    const assignDates = (topicList: TopicInput[], weight: number) => {
      for (const topic of topicList) {
        const daysForTopic = Math.round(daysPerWeight * weight);
        const endDate = dateIndex + daysForTopic;
        const topicDates = studyDates.slice(dateIndex, endDate);
        if (topicDates.length > 0) {
          topicSchedule.push({ topic: topic.topic, dates: topicDates });
        }
        dateIndex = endDate;
      }
    };
    
    // Assign hard topics first to ensure they get priority
    assignDates(hardTopics, 2);
    assignDates(easyTopics, 1);

    // If rounding left any remaining days, add them to the last topic
    if(dateIndex < studyDates.length -1) {
        if(topicSchedule.length > 0) {
            topicSchedule[topicSchedule.length - 1].dates.push(...studyDates.slice(dateIndex));
        } else if (topics.length > 0) {
            // This can happen if daysPerWeight is very small. Assign all to first topic.
            topicSchedule.push({ topic: topics[0].topic, dates: studyDates });
        }
    }

    // 3. RESOURCE GROUNDING: Query Firestore for all relevant resources
    console.log(`Querying 'resources' collection for examType: ${testName}`);
    const resourcesSnapshot = await db.collection('resources').where('category', '==', testName).get();
    const expertResources = resourcesSnapshot.docs.map(doc => doc.data() as { url: string, description: string, type: string });
    console.log(`Found ${expertResources.length} resources in Firestore.`);

    // 4. HYBRID AI: Generate tasks for each scheduled topic
    const planDayTasks: any[] = [];
    for (const schedule of topicSchedule) {
      const aiResponse = await generateStudyTasksForTopic({
        topic: schedule.topic,
        examType: testName,
        studyDates: schedule.dates.map(d => format(d, 'yyyy-MM-dd')),
        expertResources: expertResources, // Pass resources to the AI
      });

      // 5. PERSISTENCE PREP: Format the AI response into Firestore-ready documents
      for (const day of aiResponse.studyDays) {
        planDayTasks.push({
          date: new Date(day.date),
          tasks: day.tasks.map(task => ({
            topicTitle: schedule.topic,
            description: task.description,
            completed: false, // Add completed field
          }))
        });
      }
    }
    
    // 6. PERSISTENCE: Save the entire plan in a batch write
    const batch = db.batch();
    planDayTasks.forEach(planDay => {
        // Create a new doc for each day in the subcollection
        const planDayRef = db.collection('users').doc(userId).collection('tests').doc(testId).collection('planDays').doc();
        batch.set(planDayRef, planDay);
    });
    
    await batch.commit();

    return { success: true, planId: testId };

  } catch (error: any) {
    console.error("ERROR in generateAndSaveStudyPlan:", error.stack || error);
    return { success: false, error: 'An unexpected server error occurred. Could not generate study plan.' };
  }
}
