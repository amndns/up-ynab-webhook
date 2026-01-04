/**
 * LLM Category Name → YNAB Category ID Mapping
 *
 * The LLM returns a category name (e.g., "Groceries"), which we map to
 * the corresponding YNAB category ID.
 */

export const CATEGORY_NAME_TO_ID: Record<string, string | null> = {
  Rent: "9f644bfd-214c-4ac7-a70d-87330ee75439",
  Utilities: "02e65784-cb13-4efb-8814-71e249495d5d",
  Upkeep: "5ef4eaa9-e12a-46ee-aecf-769a6faab600",
  Internet: "7d68538a-c345-44c9-b9b7-06b1165bc146",
  Phone: "23478f4e-bbb5-410f-bed5-5b931bcdd37b",
  Groceries: "fe02638b-d0f2-461e-b26d-f76a0155d122",
  Transport: "3e8b0525-9871-4851-b22f-8b417a7d5d4b",
  Medical: "dd571f4a-e8ca-4c9d-babf-b45a4171f380",
  Subscriptions: "cfabaa56-f3e8-4870-a818-94399d450416",
  Unintended: "223d4d8e-c244-43b6-9399-a3b5a1f3a0d8",
  Stocks: "5ff5f845-bf41-41fc-965b-d7ee9a4f30e8",
  Business: "d90364b7-d504-4cf4-bf31-00bef318bdcb",
  Gym: "444348b9-ccee-4773-981c-1159326202ab",
  Care: "1546a35d-9ee2-48e7-81c8-e0dbe06d2d6b",
  Dining: "6be02d2d-d717-44d0-9c2b-83c4b3a79cdf",
  Spontaneous: "d4445d31-2ea5-47c3-b061-4c634ab40a1e",
  Travel: "f97d7d12-4e20-4cea-ac6b-0b4700282578",
  "Ready to Assign": "9564522b-b212-4b25-b981-5320b699ddb7", // Special case: LLM is unsure (Inflow: Ready to Assign)
};

/**
 * Valid category names the LLM can return
 */
export const VALID_CATEGORY_NAMES = Object.keys(CATEGORY_NAME_TO_ID);

/**
 * Helper to check if a category name is valid
 */
export function isValidCategoryName(name: string): boolean {
  return VALID_CATEGORY_NAMES.includes(name);
}

/**
 * Get YNAB category ID from category name
 * Returns null if category not found or is "Ready to Assign"
 */
export function getCategoryId(categoryName: string): string | null {
  return CATEGORY_NAME_TO_ID[categoryName] ?? null;
}
