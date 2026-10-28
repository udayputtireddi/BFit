import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createAIApp } from './app';
const key = defineSecret('GEMINI_API_KEY');
export const aiGateway = onRequest({
  region: 'us-central1', secrets: [key], timeoutSeconds: 120,
  maxInstances: 3, concurrency: 10, memory: '512MiB',
}, createAIApp());
