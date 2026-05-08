import { z } from "zod";

export const SourceCitation = z.object({
  filename: z.string(),
  title: z.string(),
  byline: z.string(),
  type: z.enum(["podcast", "newsletter"]),
  date: z.string(),
  source_url: z.string().optional(),
  search_url: z.string(),
  quote_excerpt: z.string().max(280),
  // optional — for podcasts, the (MM:SS) or (HH:MM:SS) marker closest to the quote
  timestamp: z.string().regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/).optional(),
});

export const QuestionOption = z.object({
  key: z.enum(["A", "B", "C", "D"]),
  text: z.string().max(250),
});

export const Question = z.object({
  position: z.number().int().min(1).max(5),
  idea_id: z.string(),
  archetype: z.enum(["apply", "diagnose", "pick", "spot", "translate"]),
  scenario_md: z.string(),
  options: z.array(QuestionOption).length(4),
  correct_key: z.enum(["A", "B", "C", "D"]),
  explanation_md: z.string(),
  pm_takeaway: z.string(),
  citation: SourceCitation,
});

export const DailyContent = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: z.string(),
  theme_pillar: z.string(),
  digest_md: z.string(),
  takeaways: z.array(z.string()).min(3).max(5),
  source: SourceCitation.partial({ quote_excerpt: true }),
  questions: z.array(Question).length(5),
});
export type DailyContent = z.infer<typeof DailyContent>;
