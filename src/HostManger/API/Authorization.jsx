import axios from "axios";
// import { routes } from "../../routes";
import { HOST_URL } from "./HostUrl";

export const axiosInstance = axios.create({
  baseURL: HOST_URL,
  withCredentials: true,
});

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       window.location.href = routes.LOGIN;
//     }
//     return Promise.reject(error);
//   }
// );
