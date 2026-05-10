import { Injectable } from '@nestjs/common';

const MODEL_ANSWER =
  "React keeps a lightweight tree of your UI and reconciles it with the real DOM: when state changes, it computes the smallest set of mutations instead of rewriting the whole page. Under the hood, Fiber models units of work so rendering can be incremental and (with concurrent features) interruptible when something more urgent arrives. In production you still measure and shape work: batch updates (automatic in modern React), split bundles and lazy-load routes, stabilize props with memo/useMemo/useCallback where profiling shows wasted child renders, virtualize huge lists, and defer non-critical updates. Use the React Profiler and browser performance tools to verify—not every memo helps.";

const KEY_TAKEAWAYS = [
  'Reconciliation + Virtual DOM idea: fewer DOM operations than naive full rewrites.',
  'Fiber: schedulable units of work; ties into concurrent rendering and priorities.',
  'Render → commit: React applies DOM updates after it knows what changed; layout thrash is still your problem if you force sync layout in effects.',
  'Production levers: code-splitting, lazy routes, list virtualization, stable keys, intentional memoization after profiling.',
  'Avoid premature optimization: memo everything only after you see hot paths in DevTools.',
];

@Injectable()
export class InterviewsService {
  streamPrompt(answer: string) {
    const suggestion = answer.includes('virtual DOM')
      ? 'Good start. Add reconciliation, Fiber scheduling, and commit phases.'
      : 'Clarify trade-offs, complexity, and real production examples.';
    return {
      questionId: 'react-rendering-perf',
      interviewer:
        'Can you explain how React handles rendering performance under heavy updates?',
      feedback: suggestion,
      score: {
        technicalDepth: answer.length > 80 ? 7 : 4,
        clarity: 6,
        completeness: answer.includes('Fiber') ? 8 : 5,
      },
      modelAnswer: MODEL_ANSWER,
      keyTakeaways: KEY_TAKEAWAYS,
    };
  }
}
