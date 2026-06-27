/**
 * utils/roboflowClient.js
 * 
 * Executes a Roboflow workflow or direct model inference with exponential backoff retries and timeout.
 * Features a fallback mechanism: if the workflow endpoint returns an error, it will automatically 
 * attempt to use the direct model inference API.
 */

export class RoboflowAPIError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "RoboflowAPIError";
        this.status = status;
    }
}

export class RoboflowNetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = "RoboflowNetworkError";
    }
}

export async function runRoboflowWorkflow(base64Data, config) {
    const {
        workspace,
        workflow,
        modelId,
        apiKey,
        baseUrl = "https://serverless.roboflow.com",
        retries = 2,
        timeoutMs = 15000,
        isProxy = false
    } = config;

    let attempt = 0;

    const executeJsonRequest = async (url, payload) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new RoboflowAPIError(`HTTP ${response.status}: ${errorText}`, response.status);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new RoboflowNetworkError("Request timed out");
            if (error instanceof RoboflowAPIError) throw error;
            throw new RoboflowNetworkError(error.message);
        }
    };

    while (attempt <= retries) {
        try {
            if (isProxy) {
                const data = await executeJsonRequest(`${baseUrl}/roboflow/scan`, { image: base64Data });
                return data.predictions || [];
            } else {
                // Try workflow first if configured
                let workflowFailed = false;
                if (workspace && workflow) {
                    const url = `${baseUrl}/${workspace}/workflows/${workflow}`;
                    const payload = {
                        api_key: apiKey,
                        inputs: { image: { type: "base64", value: base64Data } }
                    };

                    try {
                        const data = await executeJsonRequest(url, payload);
                        return extractPredictions(data, true);
                    } catch (workflowError) {
                        console.warn(`[Roboflow Client] Workflow failed: ${workflowError.message}. Falling back to direct model.`);
                        workflowFailed = true;
                        if (!modelId) throw workflowError;
                    }
                }

                // Try direct model (fallback or primary)
                if (modelId && (!workspace || !workflow || workflowFailed)) {
                    // Roboflow v1 inference API format
                    const params = new URLSearchParams({ api_key: apiKey, format: "json" });
                    const modelUrl = `${baseUrl}/${modelId}?${params.toString()}`;
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                    
                    try {
                        const response = await fetch(modelUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: base64Data,
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new RoboflowAPIError(`HTTP ${response.status}: ${errorText}`, response.status);
                        }
                        
                        const data = await response.json();
                        return extractPredictions(data, false);
                    } catch (error) {
                        clearTimeout(timeoutId);
                        if (error.name === 'AbortError') throw new RoboflowNetworkError("Request timed out");
                        if (error instanceof RoboflowAPIError) throw error;
                        throw new RoboflowNetworkError(error.message);
                    }
                } else if (!modelId && (!workspace || !workflow)) {
                    throw new Error("No Roboflow workflow or model configured.");
                }
            }
        } catch (error) {
            console.warn(`[Roboflow Client] Attempt ${attempt + 1} failed:`, error.message);
            if (attempt === retries) throw error;
            attempt++;
            const backoffTime = 500 * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, backoffTime));
        }
    }
}

function extractPredictions(data, isWorkflow) {
    if (isWorkflow) {
        // Defensive parsing for workflow output
        const firstResult = Array.isArray(data?.outputs) ? data.outputs[0] : (Array.isArray(data) ? data[0] : data);
        if (firstResult) {
            for (const val of Object.values(firstResult)) {
                if (val && Array.isArray(val.predictions)) return val.predictions;
                if (Array.isArray(val) && val.length > 0 && val[0]?.class) return val;
            }
        }
        return [];
    } else {
        // Standard model response format
        return data?.predictions || [];
    }
}
