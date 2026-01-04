# Up Bank → YNAB Transaction Automation

Cloudflare Worker that automatically syncs transactions from Up Bank to YNAB using webhooks and AI categorization.

## Features

- ✅ **Real-time sync** via Up Bank webhooks
- ✅ **Smart categorization** using Gemini 2.5 Flash
- ✅ **7 transaction scenarios** handled automatically
- ✅ **Duplicate prevention** with import IDs
- ✅ **Comprehensive logging** for debugging
- ✅ **Type-safe** with TypeScript
- ✅ **Fully tested** with Vitest

## Architecture

```
Up Bank Webhook → Verify Signature → Fetch Transaction → Determine Scenario
                                                               ↓
                                                         Categorize (LLM)
                                                               ↓
                                                         Create in YNAB
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Category IDs

Edit `src/config/categories.ts` and populate YNAB category IDs:

```bash
# Fetch your categories
curl https://api.ynab.com/v1/budgets/89de8741-0d5e-4fe0-a5ec-4991759b7910/categories \
  -H "Authorization: Bearer $YNAB_API_TOKEN"

# Update the CATEGORY_NAME_TO_ID mapping with actual IDs
```

### 3. Set Up Secrets

```bash
wrangler secret put UP_API_TOKEN
wrangler secret put UP_WEBHOOK_SECRET
wrangler secret put YNAB_API_TOKEN
wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
```

### 4. Deploy

```bash
pnpm deploy
```

### 5. Register Webhook with Up Bank

```bash
curl -X POST https://api.up.com.au/api/v1/webhooks \
  -H "Authorization: Bearer $UP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "attributes": {
        "url": "https://up-ynab-webhook.<your-subdomain>.workers.dev/webhook/up",
        "description": "YNAB Transaction Sync"
      }
    }
  }'
```

**Important:** Save the `secretKey` from the response as `UP_WEBHOOK_SECRET`.

## Development

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Transaction Scenarios

| #   | Scenario                | Up Bank           | YNAB Action                             |
| --- | ----------------------- | ----------------- | --------------------------------------- |
| 1   | Payment from Spending   | Card payment      | Debit to "Up Payroll" + LLM categorize  |
| 2   | Interest on Saver       | Interest credit   | Credit to "Up Savings"                  |
| 3   | Transfer Spending→Saver | Internal transfer | YNAB transfer between accounts          |
| 4   | Transfer Saver→Spending | Internal transfer | YNAB transfer between accounts          |
| 5   | Transfer to Joint       | Transfer to 2UP   | Debit to "Up Payroll" only + categorize |
| 6   | Payment from Saver      | Payment           | Debit to "Up Savings" + LLM categorize  |
| 7   | Joint Account           | Any               | Ignored (not tracked in YNAB)           |

## Transaction Status Logic

| Type                    | CREATED + HELD | CREATED + SETTLED | SETTLED Event       |
| ----------------------- | -------------- | ----------------- | ------------------- |
| Card payments           | ✅ Process     | ✅ Process        | ❌ Skip (duplicate) |
| Pay Anyone/Direct Debit | ❌ Wait        | ✅ Process        | ✅ Process          |
| Transfer/Interest       | N/A            | ✅ Process        | N/A                 |

## File Structure

```
src/
├── config/          # Configuration (accounts, categories, rules)
├── types/           # TypeScript type definitions
├── lib/             # External integrations (Up, YNAB, Gemini)
├── services/        # Business logic
├── handlers/        # HTTP handlers
└── utils/           # Utilities (logger, amount conversion)
```

## Testing

All core logic is tested with Vitest:

```bash
pnpm test
```

Tests cover:

- ✅ Amount conversion
- ✅ Transaction rules
- ✅ Scenario resolution
- ✅ Processing decisions
- ✅ Transaction mapping

## Logs

All transactions are logged with unique IDs for easy searching:

```
[txn:abc-123] Processing started {"event":"TRANSACTION_CREATED"}
[txn:abc-123] Scenario resolved {"scenario":1}
[txn:abc-123] Category determined {"categoryName":"Groceries"}
[txn:abc-123] YNAB transaction created {"ynabId":"xyz-789"}
```

Ignored transactions are logged for manual review:

```
[txn:def-456] [IGNORED] reason=UNKNOWN_TYPE {"type":"New Type"}
```

## Maintenance

### Adding a New Transaction Type

1. Add to `KNOWN_TRANSACTION_TYPES` in `src/config/transaction-rules.ts`
2. If it should wait for SETTLED, add to `PROCESS_ON_SETTLED_ONLY`

### Adding a New Category

1. Add definition to system prompt in `src/lib/categorizer.ts`
2. Add mapping in `src/config/categories.ts`

### Changing Account IDs

Update `src/config/accounts.ts` with new IDs.
