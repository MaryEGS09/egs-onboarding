import "dotenv/config";
import { PrismaClient, ResponseType, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type QuestionSeed = {
  key: string;
  prompt: string;
  helpText?: string;
  responseType: ResponseType;
  required: boolean;
  aiInstructions: string;
  voiceEnabled?: boolean;
  videoEnabled?: boolean;
  allowFileUpload?: boolean;
  validationRules?: Record<string, unknown>;
  options?: { value: string; label: string; allowFreeText?: boolean }[];
};

type SectionSeed = {
  key: string;
  name: string;
  questions: QuestionSeed[];
};

type PhaseSeed = {
  key: string;
  name: string;
  description: string;
  sections: SectionSeed[];
};

const VAGUE_ANSWER_INSTRUCTION =
  "If the client's answer is short, generic, or could apply to almost any business, ask one concise follow-up requesting a specific example, number, or detail before marking this complete.";

const QUESTIONNAIRE: PhaseSeed[] = [
  {
    key: "general_information",
    name: "General Information",
    description: "Basic contact and business identification details.",
    sections: [
      {
        key: "general_information",
        name: "General Information",
        questions: [
          {
            key: "general_full_name",
            prompt: "What is your full name?",
            responseType: "TEXT",
            required: true,
            aiInstructions:
              "Collect the client's full name naturally as the opening question. No follow-up needed unless the name is ambiguous.",
          },
          {
            key: "general_email",
            prompt: "What's the best email address to reach you at?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Validate this looks like a real email address before marking complete.",
            validationRules: { regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
          },
          {
            key: "general_company_name",
            prompt: "What is the name of your company?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Collect the legal or commonly-used business name.",
          },
          {
            key: "general_street_address",
            prompt: "What is your business's street address?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Collect the street address only; city/state/country are asked separately.",
          },
          {
            key: "general_city",
            prompt: "Which city is your business located in?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Simple factual field, no follow-up needed.",
          },
          {
            key: "general_state",
            prompt: "Which state or province is that in?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Simple factual field, no follow-up needed.",
          },
          {
            key: "general_country",
            prompt: "What country is your business based in?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Simple factual field, no follow-up needed.",
          },
          {
            key: "general_postal_code",
            prompt: "What is your postal/zip code?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Simple factual field, no follow-up needed.",
          },
          {
            key: "general_phone",
            prompt: "What's the best phone number to reach your business?",
            responseType: "TEXT",
            required: true,
            aiInstructions: "Simple factual field, no follow-up needed.",
          },
          {
            key: "general_website",
            prompt: "Do you have a website? If so, what's the URL?",
            responseType: "URL",
            required: false,
            aiInstructions: "Optional. If the client has no website, record that and move on without pressing.",
            validationRules: { regex: "^https?://" },
          },
          {
            key: "general_primary_industry",
            prompt: "How would you describe your primary industry category?",
            responseType: "TEXT",
            required: true,
            aiInstructions:
              "Get a clear, specific industry category (e.g. 'residential HVAC services' rather than just 'home services').",
          },
          {
            key: "general_secondary_industry",
            prompt: "Is there a secondary industry category that also applies to your business?",
            responseType: "TEXT",
            required: false,
            aiInstructions: "Optional. Skip gracefully if the client says there isn't one.",
          },
        ],
      },
    ],
  },
  {
    key: "business_overview",
    name: "Business Overview",
    description: "Mission, goals, offerings, and differentiation.",
    sections: [
      {
        key: "business_overview",
        name: "Business Overview",
        questions: [
          {
            key: "business_mission_vision",
            prompt: "What is the mission and vision for your company?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "business_goals",
            prompt: "What are your short-term and long-term business goals and objectives?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions:
              "Make sure both a short-term goal and a longer-term goal are captured; if the client only gives one horizon, ask about the other.",
          },
          {
            key: "business_current_revenue",
            prompt: "What is your current annual revenue, roughly?",
            responseType: "CURRENCY",
            required: true,
            aiInstructions:
              "A range or approximate figure is fine if the client is uncomfortable with an exact number.",
          },
          {
            key: "business_goal_revenue",
            prompt: "What revenue are you aiming to reach?",
            responseType: "CURRENCY",
            required: true,
            aiInstructions: "Capture the target figure and, if volunteered, the timeframe for reaching it.",
          },
          {
            key: "business_products_services",
            prompt:
              "Can you walk me through the products or services you offer? Categories are fine, you don't need to list every individual item.",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Categorized answers are acceptable; don't push for an exhaustive itemized list.",
          },
          {
            key: "business_most_profitable",
            prompt: "Which of those products or services are most profitable for you?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "business_differentiation",
            prompt:
              "What differentiates your business from competitors? What makes customers choose you specifically?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions:
              "This is a critical strategic question. If the client gives a generic answer like 'better service' or 'quality,' ask what specifically their team does differently that makes customers describe it that way — a concrete example, guarantee, or process the client is proud of.",
          },
          {
            key: "business_kpis",
            prompt: "What key performance metrics do you track to gauge success?",
            helpText: "Examples: revenue, leads, website traffic, profit, conversion rate, units sold, new customers.",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional. A short list of metrics is sufficient, no need to probe deeply.",
          },
        ],
      },
    ],
  },
  {
    key: "marketing_assessment",
    name: "Marketing Assessment",
    description: "Current marketing goals, lead generation, and challenges.",
    sections: [
      {
        key: "marketing_assessment",
        name: "Marketing Assessment",
        questions: [
          {
            key: "marketing_goals",
            prompt: "What are your marketing goals for the next year, and for the next three-plus years?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Confirm both a 1-year and a 3+ year goal are captured before marking complete.",
          },
          {
            key: "marketing_lead_gen_tactics",
            prompt: "What tactics are you currently using to generate leads?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "marketing_lead_gen_process",
            prompt: "Once a lead comes in, what does your process for handling it look like?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "marketing_retention_process",
            prompt: "Do you have any processes in place for customer retention or repeat business?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "marketing_top_challenge",
            prompt: "What would you say is the biggest marketing challenge your business is facing right now?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions:
              "If the client gives a broad answer like 'not enough leads,' ask a clarifying follow-up to pin down whether the issue is awareness (people finding them), response (people contacting them), or conversion (turning inquiries into customers). If the client mentions a lead source like referrals, ask approximately what percentage of new customers that represents.",
          },
          {
            key: "marketing_sales_process",
            prompt: "What does your sales process look like, from first contact to closing?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional. Capture the high-level steps, no need to go deep if the client is brief.",
          },
          {
            key: "marketing_keywords",
            prompt: "Are there any specific keywords or key phrases that are important to your business?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional. A short list is fine.",
          },
        ],
      },
    ],
  },
  {
    key: "brand_assessment",
    name: "Brand Assessment",
    description: "Brand identity, values, and competitive positioning.",
    sections: [
      {
        key: "brand_assessment",
        name: "Brand Assessment",
        questions: [
          {
            key: "brand_ideal_customer_segments",
            prompt: "How would you describe your ideal customer or customer segments?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "brand_core_message",
            prompt: "What's your core message or point of differentiation — why do customers choose you?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "brand_personality",
            prompt: "If you had to describe your brand's personality, how would you (or your customers) put it?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional. A few descriptive words or a short phrase is sufficient.",
          },
          {
            key: "brand_identity_assets",
            prompt:
              "Do you have brand identity assets you can share with us — logo, color scheme, typography, or other visual assets?",
            helpText: "Upload logo files, brand guidelines, or visual examples if you have them.",
            responseType: "FILE_UPLOAD",
            required: true,
            allowFileUpload: true,
            aiInstructions:
              "Encourage the client to upload actual files if available. If they have no formal brand assets yet, record that as the answer rather than blocking progress.",
          },
          {
            key: "brand_top_competitors",
            prompt: "Who would you say are your top three competitors? Names and websites if you have them.",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Try to get at least three named competitors with a URL for each where possible.",
          },
          {
            key: "brand_core_values",
            prompt: "What are your top five core values as a business?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Aim for five distinct values; if fewer are given, that's acceptable.",
          },
          {
            key: "brand_desired_experience",
            prompt: "What kind of experience do you want your customers to have when interacting with your team?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional.",
          },
        ],
      },
    ],
  },
  {
    key: "growth_assessment",
    name: "Growth Assessment",
    description: "Current marketing channels, budget, and technology.",
    sections: [
      {
        key: "growth_assessment",
        name: "Growth Assessment",
        questions: [
          {
            key: "growth_marketing_channels",
            prompt: "Which marketing channels are you currently using to grow the business?",
            responseType: "MULTI_CHOICE",
            required: true,
            aiInstructions: "Multi-select. If 'Other' is chosen, ask the client to briefly describe it.",
            options: [
              { value: "paid_ads_google", label: "Online Paid Ads (Google)" },
              { value: "social_media", label: "Social Media" },
              { value: "content_marketing", label: "Content Marketing" },
              { value: "networking", label: "Networking" },
              { value: "referrals", label: "Referrals" },
              { value: "sales_outreach", label: "Sales Outreach" },
              { value: "strategic_partners", label: "Strategic Partners" },
              { value: "sem", label: "Search Engine Marketing" },
              { value: "email_marketing", label: "Email Marketing" },
              { value: "print_media", label: "Print or Media Advertising (radio, news, TV)" },
              { value: "pr_media_relations", label: "PR or Media Relations" },
              { value: "events_sponsorships", label: "Events or Sponsorships" },
              { value: "other", label: "Other", allowFreeText: true },
            ],
          },
          {
            key: "growth_sales_cycle",
            prompt: "Can you describe your sales cycle — roughly how long does it take to acquire a new customer?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Try to get an approximate duration (days/weeks/months), not just a description of steps.",
          },
          {
            key: "growth_content_strategy",
            prompt: "Do you currently have a content strategy in place?",
            responseType: "SINGLE_CHOICE",
            required: false,
            aiInstructions: "Simple yes/no; if yes, a brief one-line description is a welcome bonus but not required.",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
          {
            key: "growth_marketing_budget",
            prompt: "What's your current marketing budget, and how did you arrive at that number?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions:
              "Capture both the approximate figure and the methodology (e.g. percent of revenue, fixed amount, ad hoc).",
          },
          {
            key: "growth_martech_tools",
            prompt: "What tools or platforms are you currently using for marketing and practice management?",
            helpText: "Examples: CRM, EHR, Google Analytics, content creation tools, other marketing tools.",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "List the specific tools/platforms by name where possible.",
          },
          {
            key: "growth_marketing_owner",
            prompt: "Who currently handles your marketing — internal team members, agencies, or contractors?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: "Capture both internal and external parties involved.",
          },
          {
            key: "growth_marketing_materials",
            prompt: "Do you have any previous marketing materials you can share with us?",
            helpText: "Examples: brand books, collateral, ad examples, or other marketing materials.",
            responseType: "FILE_UPLOAD",
            required: false,
            allowFileUpload: true,
            aiInstructions: "Optional. Encourage upload if available; otherwise record 'no materials available.'",
          },
        ],
      },
    ],
  },
  {
    key: "customer_assessment",
    name: "Customer Assessment",
    description: "Customer journey, satisfaction, and pain points.",
    sections: [
      {
        key: "customer_assessment",
        name: "Customer Assessment",
        questions: [
          {
            key: "customer_transaction_process",
            prompt: "Can you walk me through your new customer transaction process, from first meeting to close?",
            helpText:
              "Examples: initial meeting, agreement, registration, treatment/payment, appointment, membership, one-time service, additional services available.",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional. Capture the high-level steps.",
          },
          {
            key: "customer_onboarding_process",
            prompt: "What does your new member or new customer onboarding process look like?",
            responseType: "LONG_TEXT",
            required: true,
            aiInstructions: VAGUE_ANSWER_INSTRUCTION,
          },
          {
            key: "customer_followup_process",
            prompt: "Do you have any after-sale follow-up or communication process?",
            helpText: "Examples: routine communication, post-onboarding surveys, follow-up processes.",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional.",
          },
          {
            key: "customer_satisfaction_process",
            prompt: "How do you currently assess customer satisfaction, or request testimonials and reviews?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional.",
          },
          {
            key: "customer_ideal_values",
            prompt: "What do you think your ideal customer values most?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Optional.",
          },
          {
            key: "customer_pain_points",
            prompt:
              "What are the top three pain points, frustrations, or struggles your ideal customer deals with?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Try to get three distinct pain points if the client is willing to elaborate.",
          },
          {
            key: "customer_goals_desires",
            prompt: "And what are the top three goals or things your ideal customer wants or needs?",
            responseType: "LONG_TEXT",
            required: false,
            aiInstructions: "Try to get three distinct goals/desires if the client is willing to elaborate.",
          },
        ],
      },
    ],
  },
  {
    key: "online_presence",
    name: "Online Presence",
    description: "Where the business is currently listed online.",
    sections: [
      {
        key: "online_presence",
        name: "Online Presence",
        questions: [
          {
            key: "online_presence_urls",
            prompt:
              "Can you share the URLs for all the platforms where your business currently has a presence — Google Business Profile, Facebook, LinkedIn, Instagram, YouTube, or anywhere else?",
            responseType: "URL",
            required: true,
            aiInstructions:
              "The client may paste multiple URLs at once — capture each one along with which platform it belongs to. Validate that each value looks like a URL.",
            validationRules: { regex: "^https?://", multiple: true },
          },
        ],
      },
    ],
  },
];

async function main() {
  for (const [phaseIndex, phase] of QUESTIONNAIRE.entries()) {
    const phaseRow = await prisma.phase.upsert({
      where: { key: phase.key },
      update: { name: phase.name, description: phase.description, order: phaseIndex },
      create: { key: phase.key, name: phase.name, description: phase.description, order: phaseIndex },
    });

    for (const [sectionIndex, section] of phase.sections.entries()) {
      const existingSection = await prisma.section.findFirst({
        where: { phaseId: phaseRow.id, key: section.key },
      });
      const sectionRow = existingSection
        ? await prisma.section.update({
            where: { id: existingSection.id },
            data: { name: section.name, order: sectionIndex },
          })
        : await prisma.section.create({
            data: { phaseId: phaseRow.id, key: section.key, name: section.name, order: sectionIndex },
          });

      for (const [questionIndex, question] of section.questions.entries()) {
        const questionRow = await prisma.question.upsert({
          where: { key: question.key },
          update: {
            sectionId: sectionRow.id,
            prompt: question.prompt,
            helpText: question.helpText,
            responseType: question.responseType,
            required: question.required,
            order: questionIndex,
            aiInstructions: question.aiInstructions,
            voiceEnabled: question.voiceEnabled ?? true,
            videoEnabled: question.videoEnabled ?? true,
            allowFileUpload: question.allowFileUpload ?? false,
            validationRules: question.validationRules as Prisma.InputJsonValue | undefined,
          },
          create: {
            sectionId: sectionRow.id,
            key: question.key,
            prompt: question.prompt,
            helpText: question.helpText,
            responseType: question.responseType,
            required: question.required,
            order: questionIndex,
            aiInstructions: question.aiInstructions,
            voiceEnabled: question.voiceEnabled ?? true,
            videoEnabled: question.videoEnabled ?? true,
            allowFileUpload: question.allowFileUpload ?? false,
            validationRules: question.validationRules as Prisma.InputJsonValue | undefined,
          },
        });

        if (question.options) {
          for (const [optionIndex, option] of question.options.entries()) {
            await prisma.questionOption.upsert({
              where: { questionId_value: { questionId: questionRow.id, value: option.value } },
              update: { label: option.label, order: optionIndex, allowFreeText: option.allowFreeText ?? false },
              create: {
                questionId: questionRow.id,
                value: option.value,
                label: option.label,
                order: optionIndex,
                allowFreeText: option.allowFreeText ?? false,
              },
            });
          }
        }
      }
    }
  }

  const defaultAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@egs-solutions.com";
  const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: defaultAdminEmail } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: defaultAdminEmail,
        passwordHash: await argon2.hash(defaultAdminPassword),
        name: "EGS Admin",
        role: "SUPER_ADMIN",
      },
    });
    console.log(
      `Created default admin user: ${defaultAdminEmail} / ${defaultAdminPassword} (change this password after first login).`,
    );
  }

  console.log("Seed complete: 7 phases, questions, and options loaded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
