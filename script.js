 
const apiUrl = 'https://137.184.189.184:5000/generate';

        document.getElementById('apiForm').addEventListener('submit', function(event) {
            event.preventDefault();

            const promptValue = document.getElementById('prompt').value;

            const data = {
                model: 'tinyllama',
                prompt: promptValue,
                stream: true
            };

            const outputElement = document.getElementById('output');
            outputElement.innerText = ''; // Clear previous output

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Response details:', response.status, response.statusText);
                    throw new Error(`Network response was not ok (${response.status} ${response.statusText})`);
                }

                // Read the response as a stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = '';

                function processStream({ done, value }) {
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }

                    // Decode the chunk into a string
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Split the buffer by newlines to separate SSE data messages
                    const lines = buffer.split('\n');

                    for (let i = 0; i < lines.length - 1; i++) {
                        const line = lines[i].trim();
                        
                        if (line.startsWith('data:')) {
                            // Remove "data: " prefix and parse JSON
                            const jsonString = line.slice(5).trim();
                            try {
                                const jsonData = JSON.parse(jsonString);
                                if (jsonData.response) {
                                    if (outputElement.innerText.length > 0) {
                                        outputElement.innerText += ' ';
                                    }
                                    outputElement.innerText += jsonData.response;
                                }
                            } catch (e) {
                                console.error('Failed to parse JSON:', e);
                            }
                        }
                    }

                    // Keep the last partial line in the buffer for the next chunk
                    buffer = lines[lines.length - 1];

                    // Continue reading the next chunk
                    return reader.read().then(processStream);
                }

                return reader.read().then(processStream);
            })
            .catch(error => {console.error('API Error:', error);
                outputElement.innerText = 'Error: ' + error.message;
            });
        });
