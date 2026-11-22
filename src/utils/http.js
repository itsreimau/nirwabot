const axios = require("axios");
const { default: axiosRetry } = require("axios-retry");

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error) || [408, 429].includes(error.response?.status),
    retryDelay: (count) => Math.pow(2, count - 1) * 1000 + Math.random() * 500
});

module.exports = axios;