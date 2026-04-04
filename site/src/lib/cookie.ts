export function setCookie(
  name: string,
  value: string | number,
  days: number | string = 30,
) {
  const expires =
    typeof days == "number"
      ? new Date(Date.now() + days * 864e5).toUTCString()
      : days;
  document.cookie = `${name}=${String(value)}; expires=${expires}; path=/`;
  window.dispatchEvent(new Event("cookiechange"));
}

export function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export function delCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
  window.dispatchEvent(new Event("cookiechange"));
}
