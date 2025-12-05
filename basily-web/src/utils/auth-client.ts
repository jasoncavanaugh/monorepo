import { createAuthClient } from "better-auth/react";
import { BACKEND_URL } from "./constants";
export const auth_client = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: BACKEND_URL,
  // // disableDefaultFetchPlugins: true,
  // fetchOptions: {
  //   customFetchImpl: fetch,
  // }
});
