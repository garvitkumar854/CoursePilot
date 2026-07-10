import api from "../api/axios";

export const fetcher = (url) => api.get(url).then((res) => res.data);
