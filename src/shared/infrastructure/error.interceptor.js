/**
 * Turns failed HTTP responses into a readable message.
 * The platform API answers errors with Problem Details (RFC 9457): the reason is in `detail` or `title`.
 */
export const errorInterceptor = {
    onResponse: response => response,
    onError: error => {
        let message;
        if (error.response) {
            const data = error.response.data;
            console.error('Status:', error.response.status, 'Data:', data);
            message = data?.detail || data?.title || data?.message
                || `Error ${error.response.status}: ${error.response.statusText}`;
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
