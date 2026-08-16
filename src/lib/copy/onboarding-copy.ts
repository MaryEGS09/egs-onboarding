// Single source of truth for exact client-provided onboarding copy.
// Components should import from here rather than hardcoding strings,
// so this stays the one place to update wording.

export const AI_SPECIALIST_NAME = "Stephani";
export const AI_SPECIALIST_TITLE = "AI Onboarding Specialist";
export const AI_SPECIALIST_AVATAR = "/brand/stephani-avatar.jpg";

export const MODE_CONFIRMATION_COPY = {
  chat: {
    title: "You've selected Chat with AI.",
    body: "You'll complete your EGS onboarding questionnaire through a guided conversation with our AI onboarding assistant.",
  },
  interview: {
    title: "You've selected AI Virtual Interview.",
    body: "The AI will guide you through your EGS onboarding questionnaire and ask questions about your business, brand, customers, marketing, growth goals, and online presence. You can answer using voice, video, or text, and your progress will automatically be saved.",
  },
} as const;

export type OnboardingMode = keyof typeof MODE_CONFIRMATION_COPY;

export const WELCOME_MESSAGE = `Hello, and welcome to the EGS Marketing Solutions Onboarding Questionnaire.

The purpose of this onboarding experience is to help our team gain a deeper understanding of your business—not just the basic facts, but the details that make your company unique.

We'll ask questions about your business, services, brand, customers, marketing, goals, growth opportunities, and online presence. Your answers will help our team create strategies and deliverables that are specifically tailored to your business.

This questionnaire is divided into several sections, so you do not need to complete everything in one sitting. Your progress will be automatically saved, allowing you to leave and return whenever it's convenient for you.

Take your time, provide as much detail as you feel comfortable sharing, and don't worry if you aren't sure how to answer a question. I can clarify questions and help guide you through the process.

Let's get started.`;

export function getWelcomeBackMessage(params: {
  completedSections: number;
  totalSections: number;
  lastSectionName: string;
}): string {
  const { completedSections, totalSections, lastSectionName } = params;
  return `Welcome back! You've completed ${completedSections} of ${totalSections} onboarding sections. Your last completed section was ${lastSectionName}. Would you like to continue where you left off?`;
}

export const REVIEW_SELECTION_COPY = {
  heading: "Select information you want to update:",
  submitLabel: "Review Selected Questions",
} as const;

export const FINAL_CONFIRMATION_COPY = {
  prompt:
    "Your information has been updated. Please review the latest version and confirm that everything is accurate.",
  confirmLabel: "Everything Looks Correct",
  moreChangesLabel: "I Need to Make More Changes",
} as const;

export const COMPLETION_MESSAGE = `Thank You for Completing Your EGS Onboarding

We sincerely appreciate the time and thought you invested in sharing your business with us.

Your onboarding information has been successfully completed and submitted to the EGS Marketing Solutions team.

Your responses will help our team better understand your business, brand, customers, goals, and opportunities so we can develop marketing strategies and deliverables specifically tailored to your needs.

Welcome to EGS Marketing Solutions. We look forward to working with you and helping your business Engage, Grow, and Succeed.`;

export const PROGRESS_SAVED_LABEL = "✓ Progress saved";

export const REVIEW_INTRO_COPY =
  "Please review this information carefully. If anything is missing, inaccurate, or needs clarification, you can ask me to update specific answers.";

export const SECTION_BREAK_COPY = {
  continueLabel: "Continue",
  saveAndExitLabel: "Save & Exit",
} as const;
