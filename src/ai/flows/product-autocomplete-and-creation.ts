'use server';
/**
 * @fileOverview Provides product name autocompletion and creation functionality for invoice creation.
 *
 * - autocompleteProduct - Autocompletes product names based on user input, with an option to create a new product.
 * - AutocompleteProductInput - The input type for the autocompleteProduct function.
 * - AutocompleteProductOutput - The return type for the autocompleteProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutocompleteProductInputSchema = z.object({
  productName: z
    .string()
    .describe('The product name to autocomplete or create.'),
  existingProducts: z.array(z.string()).describe('A list of existing product names.'),
});
export type AutocompleteProductInput = z.infer<typeof AutocompleteProductInputSchema>;

const AutocompleteProductOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of autocompleted product name suggestions.'),
  createNewProduct: z
    .boolean()
    .describe(
      'Whether the user wants to create a new product with the given name.  If true, the calling code MUST create the product in the database.'
    ),
});
export type AutocompleteProductOutput = z.infer<typeof AutocompleteProductOutputSchema>;

export async function autocompleteProduct(
  input: AutocompleteProductInput
): Promise<AutocompleteProductOutput> {
  return autocompleteProductFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autocompleteProductPrompt',
  input: {schema: AutocompleteProductInputSchema},
  output: {schema: AutocompleteProductOutputSchema},
  prompt: `You are a helpful assistant that suggests product names for an invoice creation form.

You are given a product name entered by the user, and a list of existing product names.

If the user's product name is similar to an existing product name, suggest the existing product name.

If the user's product name does not match any existing product names, suggest that the user create a new product.

Here are the existing product names:
{{#each existingProducts}}
- "{{{this}}}"
{{/each}}

User entered product name: "{{{productName}}}"

Based on this, populate the suggestions field with suggested product names.  If no existing product names are similar to the user's product name, set createNewProduct to true.
`,
});

const autocompleteProductFlow = ai.defineFlow(
  {
    name: 'autocompleteProductFlow',
    inputSchema: AutocompleteProductInputSchema,
    outputSchema: AutocompleteProductOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
