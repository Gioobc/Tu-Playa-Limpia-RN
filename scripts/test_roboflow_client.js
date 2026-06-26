/**
 * Smoke test for Roboflow Client
 * Usage: node scripts/test_roboflow_client.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runRoboflowWorkflow } from '../utils/roboflowClient.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to scripts folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testImagePath = path.join(__dirname, '..', 'test.jpg');
let base64Data = "";
if (fs.existsSync(testImagePath)) {
    const fileData = fs.readFileSync(testImagePath);
    base64Data = fileData.toString('base64');
} else {
    // Fallback dummy 1x1 pixel base64 image
    base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
}

const config = {
    workspace: process.env.EXPO_PUBLIC_ROBOFLOW_WORKSPACE,
    workflow: process.env.EXPO_PUBLIC_ROBOFLOW_WORKFLOW,
    modelId: process.env.EXPO_PUBLIC_ROBOFLOW_MODEL,
    apiKey: process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY,
    retries: 1,
    timeoutMs: 15000,
    isProxy: false
};

async function test() {
    console.log('--- Smoke testing Roboflow Client ---');
    console.log('Using config:', {
        workspace: config.workspace,
        workflow: config.workflow,
        modelId: config.modelId
    });
    
    try {
        console.log('Running inference...');
        const predictions = await runRoboflowWorkflow(base64Data, config);
        console.log('Success! Predictions parsed:');
        console.log(JSON.stringify(predictions, null, 2));
        
        if (Array.isArray(predictions)) {
            console.log(`✅ Smoke test passed. Extracted ${predictions.length} items defensively.`);
        } else {
            console.log(`❌ Smoke test failed. Predictions is not an array.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Smoke test failed with exception:', error);
        process.exit(1);
    }
}

test();
