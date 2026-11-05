import { API_URL, showLogin } from "../stores/global.js";

const noLoginRoutes = ["/chatly"];

export const load = async ({ fetch, route }) => {
  showLogin.set(!noLoginRoutes.find((r) => route.id && route.id.startsWith(r)));

  try {
    const res = await fetch(`${API_URL}/status`);
    const data = await res.json();
    return { statusMessage: data as StatusMessage };
  } catch {
    return { statusMessage: null };
  }
};
