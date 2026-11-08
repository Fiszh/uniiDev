const UChat_Testers = [
  "413189785", // JOLONG66
  "440235768", // SPEEDYEMPEROR
  "113944563", // REAPEX_1
  "765207728", // DEVPOLAND
  "166427338", // FTK789
  "404660262", // CREEPYCODE
  "185965290", // UNIVERSITY_1
  "528761326", // MAIN
];

function GET_CDN_URL() {
  switch (process.env.NODE_ENV) {
    case "development":
      return `http://cdn.localhost:3000`;
    case "v2":
      return `http://cdn.unii.dev/v2`;
    default:
      return `https://cdn.unii.dev`;
  }
}

function GET_API_URL() {
  switch (process.env.NODE_ENV) {
    case "development":
      return `http://api.localhost:3000`;
    case "v2":
      return "http://api.localhost:3001";
    default:
      return `https://api.unii.dev`;
  }
}

export function GET_PORT() {
  switch (process.env.NODE_ENV) {
    case "v2":
      return 3001;
    default:
      return 3000;
  }
}

export const CDN_URL = GET_CDN_URL();
export const API_URL = GET_API_URL();

export const allowed_sites = [
  "http://localhost:5173",
  "https://unii.dev",
  "https://chat.unii.dev",
  "https://api.unii.dev",
  "https://dev.unii.dev",
  "https://www.unii.dev",
];

export const security_headers = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' https://cdn.jsdelivr.net https://fonts.scalar.com data:",
  "connect-src 'self' https://7tv.io https://7tv.app https://cdn.jsdelivr.net",
  "object-src 'none'",
  "upgrade-insecure-requests",
];

export { UChat_Testers };
