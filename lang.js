// Import LangflowClient functionality
class LangflowClient {
    constructor(baseURL, applicationToken) {
        this.baseURL = baseURL;
        this.applicationToken = applicationToken;
    }
    async post(endpoint, body, headers = { "Content-Type": "application/json" }) {
        headers["Authorization"] = `Bearer ${this.applicationToken}`;
        headers["Content-Type"] = "application/json";
        const url = `${this.baseURL}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            const responseMessage = await response.json();
            if (!response.ok) {
                throw new Error(
                    `${response.status} ${response.statusText} - ${JSON.stringify(responseMessage)}`
                );
            }
            return responseMessage;
        } catch (error) {
            console.error('Request Error:', error.message);
            throw error;
        }
    }

    async initiateSession(flowId, langflowId, inputValue, inputType = 'chat', outputType = 'chat', stream = false, tweaks = {}) {
        const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
        return this.post(endpoint, { input_value: inputValue, input_type: inputType, output_type: outputType, tweaks: tweaks });
    }

    handleStream(streamUrl, onUpdate, onClose, onError) {
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onUpdate(data);
        };

        eventSource.onerror = (event) => {
            console.error('Stream Error:', event);
            onError(event);
            eventSource.close();
        };

        eventSource.addEventListener('close', () => {
            onClose('Stream closed');
            eventSource.close();
        });

        return eventSource;
    }

    async runFlow(flowIdOrName, langflowId, inputValue, inputType = 'chat', outputType = 'chat', tweaks = {}, stream = false, onUpdate, onClose, onError) {
        try {
            const initResponse = await this.initiateSession(flowIdOrName, langflowId, inputValue, inputType, outputType, stream, tweaks);
            console.log('Init Response:', initResponse);
            if (stream && initResponse?.outputs?.[0]?.outputs?.[0]?.artifacts?.stream_url) {
                const streamUrl = initResponse.outputs[0].outputs[0].artifacts.stream_url;
                console.log(`Streaming from: ${streamUrl}`);
                this.handleStream(streamUrl, onUpdate, onClose, onError);
            }
            return initResponse;
        } catch (error) {
            console.error('Error running flow:', error);
            onError('Error initiating session');
        }
    }
}

// Initialize Langflow Client
const langflowClient = new LangflowClient(
    'https://api.langflow.astra.datastax.com',
    '<YOUR_APPLICATION_TOKEN>'
);

// Replace analyzeDataWithLangflow with Langflow Integration
async function analyzeDataWithLangflow(data) {
    const inputValue = JSON.stringify(data); // Prepare data for Langflow
    const flowId = 'd982c211-3998-4471-9df1-e39e7172c478';
    const langflowId = '8fce1900-dfd0-4f91-ad4a-017d7f6f7a4b';

    const tweaks = {
        // Example tweak settings
        "CustomComponent-ODMuq": {},
    };

    try {
        const response = await langflowClient.runFlow(
            flowId,
            langflowId,
            inputValue,
            'json', // inputType
            'json', // outputType
            tweaks,
            false, // stream (set to false for simplicity)
            (data) => console.log("Received:", data.chunk), // onUpdate
            (message) => console.log("Stream Closed:", message), // onClose
            (error) => console.log("Stream Error:", error) // onError
        );

        if (response && response.outputs) {
            const flowOutputs = response.outputs[0];
            const firstComponentOutputs = flowOutputs.outputs[0];
            const output = firstComponentOutputs.outputs.message;

            console.log("Final Output:", output.message.text);
            return output.message.text; // Return processed insights
        }
    } catch (error) {
        console.error('Error analyzing data with Langflow:', error);
        throw error;
    }
}

// Existing User Interaction Logic
const ctaButton = document.getElementById('ctaButton');
const resultsSection = document.getElementById('resultsSection');

ctaButton.addEventListener('click', async () => {
    const userPostType = prompt('Enter the type of post: "carousel", "reels", or "static"');

    if (!userPostType) {
        alert('No post type provided. Please try again.');
        return;
    }

    try {
        // 1. Fetch Engagement Data from Astra DB
        const engagementData = await fetchEngagementData(userPostType.toLowerCase());
        if (!engagementData) {
            alert('No data found for that post type. Please try "carousel", "reels", or "static".');
            return;
        }

        // 2. Analyze Post Performance with Langflow
        const insights = await analyzeDataWithLangflow(engagementData);

        // 3. Provide AI-Generated Insights
        displayResults(userPostType, insights);
    } catch (error) {
        console.error('Error during analysis:', error);
        alert('An error occurred while processing the data.');
    }
});

// Updated displayResults function
function displayResults(postType, insights) {
    resultsSection.innerHTML = `
        <div class="result">
            <h2>Post Type: ${postType.toUpperCase()}</h2>
            <p><strong>AI Insights:</strong> ${insights}</p>
        </div>
    `;
}
