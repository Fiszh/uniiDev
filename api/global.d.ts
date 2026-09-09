export {};

declare global {
  var allowedOrigins: string[];

  type HTTPMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "OPTIONS"
    | "HEAD"
    | "CONNECT"
    | "TRACE";
}
