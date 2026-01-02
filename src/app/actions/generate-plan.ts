'use server';

import { db } from '@/lib/firebaseAdmin';
import { generateStudyTasksForTopic } from '@/ai/flows/generate-study-tasks-flow';
import { addDays, differenceInDays, format } from 'date-fns';

type TopicInput = {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

type ActionInput = {
  userId: string;
  testId: string;
  testName: string;
  testDate: Date;
  availableStudyDays: string[]; 
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

export async function generateAndSaveStudyPlan(input: ActionInput): Promise<ActionResult> {
  const { userId, testId, testName, testDate, availableStudyDays, topics } = input;

  try {
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

    const easyTopics = topics.filter(t => t.difficulty === 'Easy');
    const mediumTopics = topics.filter(t => t.difficulty === 'Medium');
    const hardTopics = topics.filter(t => t.difficulty === 'Hard');
    const totalWeight = easyTopics.length * 1 + mediumTopics.length * 1.5 + hardTopics.length * 2;
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
    
    assignDates(hardTopics, 2);
    assignDates(mediumTopics, 1.5);
    assignDates(easyTopics, 1);

    if(dateIndex < studyDates.length -1) {
        if(topicSchedule.length > 0) {
            topicSchedule[topicSchedule.length - 1].dates.push(...studyDates.slice(dateIndex));
        } else if (topics.length > 0) {
            topicSchedule.push({ topic: topics[0].topic, dates: studyDates });
        }
    }

    const resourcesSnapshot = await db.collection('resources').where('category', '==', testName).get();
    const expertResources = resourcesSnapshot.docs.map(doc => doc.data() as { url: string, description: string, type: string });

    const planDayTasks: any[] = [];
    for (const schedule of topicSchedule) {
      if (schedule.dates.length === 0) continue;
      const aiResponse = await generateStudyTasksForTopic({
        topic: schedule.topic,
        examType: testName,
        studyDates: schedule.dates.map(d => format(d, 'yyyy-MM-dd')),
        expertResources: expertResources,
      });

      for (const day of aiResponse.studyDays) {
        planDayTasks.push({
          date: new Date(day.date),
          tasks: day.tasks.map(task => ({
            topicTitle: schedule.topic,
            description: task.description,
            completed: false, 
          }))
        });
      }
    }
    
    const batch = db.batch();
    const testRef = db.collection('users').doc(userId).collection('tests').doc(testId);
    batch.set(testRef, {
        testName: testName,
        testDate: testDate,
        createdAt: new Date(),
    });

    planDayTasks.forEach(planDay => {
        const planDayRef = testRef.collection('planDays').doc();
        batch.set(planDayRef, planDay);
    });
    
    await batch.commit();
    return { success: true, planId: testId };

  } catch (error: any) {
    console.error("ERROR in generateAndSaveStudyPlan:", error.stack || error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}