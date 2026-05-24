import axios from 'axios'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const statusCode = error.response?.status

        if (statusCode === 401) {
            window.dispatchEvent(new Event('reconsta:unauthorized'))
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            'Something went wrong'

        error.message = message

        return Promise.reject(error)
    }
)

export default apiClient