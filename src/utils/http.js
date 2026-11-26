const axios = require("axios");
const { default: axiosRetry } = require("axios-retry");

axios.defaults.timeout = 60000;
if (process.env.FETCH_PROXY) {
    axios.defaults.httpsAgent = new (require("https-proxy-agent").HttpsProxyAgent)(process.env.FETCH_PROXY);
    axios.defaults.proxy = false;
}

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        const method = error.config?.method;
        const abortedMidResponse = (error.code === "ECONNRESET" || error.cause?.code === "ECONNRESET") && ["get", "head", "options", "put", "delete"].includes(method);
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || [408, 429].includes(error.response?.status) || abortedMidResponse;
    },
    retryDelay: (count) => Math.pow(2, count - 1) * 1000 + Math.random() * 500
});

module.exports = axios;
