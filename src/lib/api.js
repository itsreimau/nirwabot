// Daftar API gratis: https://aelbei.surge.sh/
const APIs = {
    faaa: {
        baseURL: "https://api-faa.my.id"
    },
    moondrowend: {
        baseURL: "https://api-moondrowend.web.id"
    },
    nexray: {
        baseURL: "https://api.nexray.eu.cc"
    },
    omegatech: {
        baseURL: "https://api.omegatech.app"
    },
    varhad: {
        baseURL: "https://v2.api-varhad.my.id"
    },
    siputzx: {
        baseURL: "https://api.siputzx.my.id"
    },
    zellrayy: {
        baseURL: "https://zellrayy.com"
    }
};

function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
    const api = APIs[apiNameOrURL];
    if (!api) {
        const url = new URL(apiNameOrURL);
        apiNameOrURL = url;
    }

    const queryParams = new URLSearchParams(params);
    if (apiKeyParamName && api && "APIKey" in api) queryParams.set(apiKeyParamName, api.APIKey);

    const baseURL = api ? api.baseURL : apiNameOrURL.origin;
    const apiUrl = new URL(endpoint, baseURL);
    apiUrl.search = queryParams.toString();

    return apiUrl.toString();
}

function listUrl() {
    return APIs;
}

module.exports = {
    createUrl,
    listUrl
};