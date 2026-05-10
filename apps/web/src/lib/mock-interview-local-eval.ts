/** Back-compat re-exports; canonical bank lives in `interview-question-bank.ts`. */

export {
  DEFAULT_QUESTION_ID,
  INTERVIEW_QUESTION_BANK,
  evaluateQuestion,
  getQuestionById,
  listQuestionsPublic,
  type BankQuestion,
  type MockInterviewResult,
  type QuestionDifficulty,
} from "./interview-question-bank";

import { DEFAULT_QUESTION_ID, evaluateQuestion } from "./interview-question-bank";

export function evaluateMockInterviewLocally(answer: string) {
  return evaluateQuestion(answer, DEFAULT_QUESTION_ID);
}
