import axios
  from "axios";


// ======================================================
// LOCAL DEVELOPMENT
// ======================================================

const isLocalDevelopment =
  typeof window !==
    "undefined" &&
  (
    window.location.hostname ===
      "127.0.0.1" ||
    window.location.hostname ===
      "localhost"
  );


// ======================================================
// API BASE URL
//
// LOCAL:
//
// Frontend:
// http://127.0.0.1:5173
//
// Backend:
// http://127.0.0.1:5000
//
// PUBLIC:
//
// Uses VITE_API_BASE_URL
// Example:
// /api/v1
// ======================================================

const API_BASE_URL =
  isLocalDevelopment
    ? "http://127.0.0.1:5000/api/v1"
    : (
        import.meta.env
          .VITE_API_BASE_URL ||
        "/api/v1"
      );


// ======================================================
// AXIOS INSTANCE
// ======================================================

const api =
  axios.create({

    baseURL:
      API_BASE_URL,

    timeout:
      30000,

  });


// ======================================================
// REQUEST INTERCEPTOR
//
// JWT is attached when available.
//
// Local development can work without JWT because
// backend middleware provides local development access.
// ======================================================

api.interceptors.request.use(
  (
    config
  ) => {

    const token =
      localStorage.getItem(
        "revenue_token"
      );


    if (
      token
    ) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    // ==================================================
    // FORMDATA
    // ==================================================

    if (
      config.data instanceof
      FormData
    ) {

      delete config.headers[
        "Content-Type"
      ];

    }


    return config;

  },
  (
    error
  ) => {

    return Promise.reject(
      error
    );

  }
);


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (
    response
  ) => {

    return response;

  },
  (
    error
  ) => {

    if (
      error.response?.status ===
        401 &&
      !isLocalDevelopment
    ) {

      localStorage.removeItem(
        "revenue_token"
      );

      localStorage.removeItem(
        "revenue_user"
      );

    }


    return Promise.reject(
      error
    );

  }
);


export default api;