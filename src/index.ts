import { Hono } from "hono";
import { handleUpWebhook } from "./handlers/webhook";

interface Env {
  UP_API_TOKEN: string;
  UP_WEBHOOK_SECRET: string;
  YNAB_API_TOKEN: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
}

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    service: "up-ynab-webhook",
    status: "running",
  });
});

// Up Bank webhook endpoint
app.post("/webhook/up", handleUpWebhook);

// Export the Hono app
export default app;
