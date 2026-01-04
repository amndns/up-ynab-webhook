# Quick Start Guide

## Prerequisites

- Up Bank account with API access
- YNAB account with API access
- Google AI API key (for Gemini)
- Cloudflare account

## 5-Minute Setup

### 1. Fetch YNAB Category IDs

```bash
curl https://api.ynab.com/v1/budgets/89de8741-0d5e-4fe0-a5ec-4991759b7910/categories \
  -H "Authorization: Bearer YOUR_YNAB_TOKEN" \
  | jq '.data.category_groups[].categories[] | {id, name}'
```

### 2. Update Category Mapping

Edit `src/config/categories.ts` and replace `null` with actual YNAB category IDs:

```typescript
export const CATEGORY_NAME_TO_ID: Record<string, string | null> = {
  Rent: "abc-123-your-rent-category-id",
  Utilities: "def-456-your-utilities-id",
  // ... etc
};
```

### 3. Install & Deploy

```bash
pnpm install
pnpm test       # Verify everything works
pnpm deploy
```

### 4. Set Secrets

```bash
wrangler secret put UP_API_TOKEN
# Paste your Up Bank token

wrangler secret put YNAB_API_TOKEN
# Paste your YNAB token

wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
# Paste your Google AI key

wrangler secret put UP_WEBHOOK_SECRET
# Leave empty for now, we'll set this in step 5
```

### 5. Register Webhook

```bash
curl -X POST https://api.up.com.au/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_UP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "attributes": {
        "url": "https://up-ynab-webhook.up-ynab-webhook.workers.dev/webhook/up",
        "description": "YNAB Transaction Sync"
      }
    }
  }'
```

**Important:** Copy the `secretKey` from the response and set it:

```bash
wrangler secret put UP_WEBHOOK_SECRET
# Paste the secretKey from the webhook creation response
```

### 6. Test It!

Make a small purchase with your Up Bank card and watch the logs:

```bash
wrangler tail
```

You should see:

```
[txn:...] Processing started
[txn:...] Scenario resolved
[txn:...] Category determined
[txn:...] YNAB transaction created
```

## Troubleshooting

### "Invalid signature" error

- Check that `UP_WEBHOOK_SECRET` matches the `secretKey` from webhook creation
- Verify the webhook URL is correct

### "Unknown transaction type" in logs

- Add the new type to `KNOWN_TRANSACTION_TYPES` in `src/config/transaction-rules.ts`
- Redeploy: `pnpm deploy`

### Transaction not categorized

- Check that category IDs in `src/config/categories.ts` are correct
- Look for `[IGNORED]` in logs to see what was skipped

### Duplicate transactions

- This is expected! The `import_id` prevents duplicates
- You'll see "Transaction already exists (duplicate import_id)" in logs

## What Gets Synced?

| Up Bank Transaction        | YNAB Result                                 |
| -------------------------- | ------------------------------------------- |
| Card payment (spending)    | ✅ Debit in "Up Payroll" + auto-categorized |
| Interest (saver)           | ✅ Credit in "Up Savings"                   |
| Transfer spending→saver    | ✅ YNAB transfer between accounts           |
| Transfer to joint account  | ✅ Debit in "Up Payroll" only               |
| Joint account transactions | ❌ Ignored (not tracked)                    |

## Viewing Logs

```bash
# Live tail
wrangler tail

# Filter for a specific transaction
wrangler tail | grep "txn:abc-123"

# Filter for ignored transactions
wrangler tail | grep "IGNORED"
```

## Need Help?

1. Check logs: `wrangler tail`
2. Run tests: `pnpm test`
3. Review `PLAN.md` for detailed architecture
4. Check `README.md` for full documentation
