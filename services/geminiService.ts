import { aiRequest } from './aiClient';
export async function getCoachResponse(userMessage: string, context?: string): Promise<string> {
  try { return (await aiRequest<{ text: string }>('coach', { message: userMessage, context })).text; }
  catch (error) { return error instanceof Error ? error.message : 'AI coach is temporarily unavailable.'; }
}
