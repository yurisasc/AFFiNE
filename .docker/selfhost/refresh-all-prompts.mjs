import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy prompts from /packages/backend/server/src/plugins/copilot/prompt/prompts.ts
export const prompts = [];

async function main() {
  console.log('Connecting to database...');
  for (const prompt of prompts) {
    // Upsert the prompt and replace all its messages
    await prisma.aiPrompt.upsert({
      create: {
        name: prompt.name,
        action: prompt.action,
        config: prompt.config || undefined,
        model: prompt.model,
        messages: {
          create: prompt.messages.map((message, idx) => ({
            idx,
            role: message.role,
            content: message.content,
            params: message.params || undefined,
          })),
        },
      },
      where: { name: prompt.name },
      update: {
        action: prompt.action,
        config: prompt.config ?? undefined,
        model: prompt.model,
        updatedAt: new Date(),
        messages: {
          deleteMany: {},
          create: prompt.messages.map((message, idx) => ({
            idx,
            role: message.role,
            content: message.content,
            params: message.params || undefined,
          })),
        },
      },
    });
    console.log(`Prompt refreshed: ${prompt.name}`);
  }
  await prisma.$disconnect();
  console.log('All prompts refreshed successfully.');
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
