/**
 * LLM Transaction Categorizer
 *
 * Uses Gemini 2.5 Flash to categorize transactions into predefined categories.
 */

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCategoryId, isValidCategoryName } from "../config/categories";
import type {
  CategorizationInput,
  CategorizationOutput,
} from "../types/internal";

/**
 * System prompt for transaction categorization
 */
export const CATEGORIZATION_SYSTEM_PROMPT = `You are an expert in categorizing financial transactions with a deep understanding of various expense types. Your task is to accurately categorize a financial transaction based on its name and associated description, following these steps:

1. Receive the name and associated description of a bank transaction.

2. Categorize the transaction into exactly one of the following categories, using the provided definitions to guide your decision:

    - Rent: Your regular payment for your primary residential accommodation.
    - Utilities: Recurring bills for essential services such as gas, water, and electricity.
    - Upkeep: Expenses related to maintaining cleanliness and order in your living space (e.g., cleaning supplies, services).
    - Internet: Your monthly internet service provider bill.
    - Phone: Your recurring mobile phone bill.
    - Groceries: Purchases of food and household supplies from supermarkets, grocery stores, or similar.
    - Transport: Costs associated with commuting and local travel, including ride-sharing services like Uber/Didi, and public transportation within Australia (e.g., train, bus, tram).
    - Medical: Expenses related to healthcare, including health insurance premiums, visits to general practitioners, specialists, physiotherapists, dentists, and prescription medications.
    - Subscriptions: Recurring payments for personal software, online services, or digital content used for personal reasons.
    - Unintended: Unexpected and necessary expenses arising from emergencies or unforeseen situations.
    - Stocks: Transfers of funds specifically designated for your stock brokerage account.
    - Business: All expenses directly related to your side hustle or professional activities, including software subscriptions used for business purposes.
    - Gym: Your regular membership fees for a fitness facility.
    - Care: Expenses related to personal well-being and appearance, such as haircuts, manicures/pedicures, and the purchase of skincare or cosmetic products.
    - Dining: Costs incurred when eating out at restaurants, cafes, or ordering food for delivery.
    - Spontaneous: Discretionary spending on non-essential items or activities that are not covered by any of the above categories (e.g., hobbies, entertainment, impulse purchases).
    - Travel: Expenses specifically for leisure travel, vacations, or recreational activities (excluding material purchases during travel).

3. Uncertainty Handling:

    - If you are highly unsure about the correct category after considering the name, description, and definitions, output:
      - "Ready to Assign"

4. Output Format:

    - Return only the single, most appropriate category name as the result.
    - Do not include any additional text, explanations, or reasoning.`;

/**
 * Categorize a transaction using Gemini 2.5 Flash
 *
 * @param input - Transaction details to categorize
 * @param apiKey - Google AI API key
 * @returns Category name, ID, and whether it should be approved
 */
export async function categorizeTransaction(
  input: CategorizationInput,
  apiKey: string
): Promise<CategorizationOutput> {
  // Build the description string from available data
  const descriptionParts = [
    input.parentCategory,
    input.category,
    input.message,
  ].filter(Boolean);

  const descriptionString =
    descriptionParts.length > 0 ? descriptionParts.join(" ") : "";

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: CATEGORIZATION_SYSTEM_PROMPT,
      prompt: `Please categorize the given transaction below:
- **Name**: ${input.description}
- **Description**: ${descriptionString}`,
    });

    // Clean and validate the response
    const categoryName = text.trim();

    if (!isValidCategoryName(categoryName)) {
      console.warn(`LLM returned invalid category: "${categoryName}"`);
      return {
        categoryName: "Ready to Assign",
        categoryId: null,
        approved: false,
      };
    }

    const categoryId = getCategoryId(categoryName);

    return {
      categoryName,
      categoryId,
      approved: categoryId !== null, // Approved unless "Ready to Assign"
    };
  } catch (error) {
    console.error("Categorization failed:", error);
    return {
      categoryName: "Ready to Assign",
      categoryId: null,
      approved: false,
    };
  }
}
