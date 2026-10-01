export const errorInterceptor = {
    onResponse: response => response,
    onError: error => {
        let message;
        if (error.response) {
            console.error('Status:', error.response.status, 'Data:', error.response.data);
            message = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            console.error('Request:', error.request);
            message = 'No response received from the server. Please check that the API is running.';
        } else {
            console.error('Error Message:', error.message);
            message = error.message;
        }
        return Promise.reject(message);
    }
};