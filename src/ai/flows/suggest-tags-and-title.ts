
'use server';
/**
 * @fileOverview This file contains the Genkit flow for suggesting relevant tags and identifying the article title when a user saves a new link.
 *
 * - suggestTagsAndTitle - A function that processes a link and returns suggested tags and the article title.
 * - SuggestTagsAndTitleInput - The input type for the suggestTagsAndTitle function.
 * - SuggestTagsAndTitleOutput - The return type for the suggestTagsAndTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsAndTitleInputSchema = z.object({
  url: z.string().url().describe('The URL of the link to be analyzed.'),
});
export type SuggestTagsAndTitleInput = z.infer<typeof SuggestTagsAndTitleInputSchema>;

const SuggestTagsAndTitleOutputSchema = z.object({
  title: z.string().optional().describe('The title of the article. If no title can be found, this can be omitted.'),
  description: z.string().optional().describe('A one or two sentence summary of the page content.'),
  tags: z.array(z.string()).optional().describe('An array of suggested tags for the link.'),
  imageUrl: z.string().url().optional().describe('An absolute URL for a preview image for the link, preferably an Open Graph image.'),
});
type SuggestTagsAndTitleOutput = z.infer<typeof SuggestTagsAndTitleOutputSchema>;

export async function suggestTagsAndTitle(input: SuggestTagsAndTitleInput): Promise<SuggestTagsAndTitleOutput> {
  return suggestTagsAndTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsAndTitlePrompt',
  input: {schema: SuggestTagsAndTitleInputSchema},
  output: {schema: SuggestTagsAndTitleOutputSchema},
  prompt: `You are an expert at analyzing web pages to extract key information. Your task is to identify the main title, generate a short description, create relevant tags, and find a preview image for the content at the provided URL.

When analyzing the page, focus on the primary content. Ignore headers, footers, navigation bars, and comment sections if possible.

Analyze the content of the following URL: {{media url=url}}

Based on your analysis, provide the following information if available:
1.  **title**: The main title of the article or project. If no title can be found, this can be omitted.
2.  **description**: A concise, one or two-sentence summary of the content.
3.  **tags**: An array of 3 to 5 relevant keywords or tags that describe the content.
4.  **imageUrl**: A URL for a suitable preview image. Look for the 'og:image' meta tag first. If it's not available, find another representative image from the page. The URL must be an absolute URL (it must start with http:// or https://).

Your response MUST be a valid JSON object that adheres to the output schema. If you cannot determine a value for an optional field, omit it from the response. The 'tags' field MUST be a JSON array of strings if present.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const suggestTagsAndTitleFlow = ai.defineFlow(
  {
    name: 'suggestTagsAndTitleFlow',
    inputSchema: SuggestTagsAndTitleInputSchema,
    outputSchema: SuggestTagsAndTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
