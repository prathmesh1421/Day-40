import axios from "axios";

export const API = axios.create({
  baseURL: "http://10.0.2.2:3000/api/patients",
  timeout: 10000,
});

export default API;
