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
  title: z.string().describe('The title of the article.'),
  tags: z.array(z.string()).describe('An array of suggested tags for the link.'),
});
export type SuggestTagsAndTitleOutput = z.infer<typeof SuggestTagsAndTitleOutputSchema>;

export async function suggestTagsAndTitle(input: SuggestTagsAndTitleInput): Promise<SuggestTagsAndTitleOutput> {
  return suggestTagsAndTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsAndTitlePrompt',
  input: {schema: SuggestTagsAndTitleInputSchema},
  output: {schema: SuggestTagsAndTitleOutputSchema},
  prompt: `You are an expert at analyzing web pages. For the given URL, please extract the article title and suggest 3-5 relevant tags.

Analyze the content of the following URL: {{media url=url}}

Your response MUST be a valid JSON object that adheres to the output schema. The 'tags' field MUST be a JSON array of strings.`,
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
