import axios from "axios";
import { UChat_Testers } from "$store/globals";

interface twitch_res {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
  UChat_Tester?: boolean;
}

interface validate_err {
  error: string;
  status: number;
  message: string;
}

export async function validateUser(
  token: string,
): Promise<twitch_res | validate_err> {
  try {
    const { data } = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: token,
      },
    });

    return data;
  } catch (error) {
    return {
      error: "Unauthorized",
      status: 401,
      message: "Invalid or expired token",
    };
  }
}

interface mod_res {
  data: {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
  }[];
  pagination: {
    cursor: string;
  };
}

export async function getModdedChannels(
  token: string,
  client_id: string,
  user_id: string,
): Promise<mod_res | validate_err> {
  try {
    const { data } = await axios.get(
      `https://api.twitch.tv/helix/moderation/channels?user_id=${user_id}&first=100`,
      {
        headers: {
          Authorization: token,
          "Client-Id": client_id,
        },
      },
    );

    return data;
  } catch (error) {
    return {
      error: "Unauthorized",
      status: 401,
      message: "Invalid or expired token",
    };
  }
}

export async function validate(token: string) {
  if (!token || !token.startsWith("Bearer")) return null;

  const user_info = await validateUser(token);

  if ("error" in user_info == false && user_info["user_id"])
    user_info["UChat_Tester"] = UChat_Testers.includes(user_info["user_id"]);

  return user_info;
}
