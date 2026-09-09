import fs from "fs";
import path from "path";

const data_path = path.resolve(".", "data");
if (!fs.existsSync(data_path))
  fs.mkdirSync(path.resolve(data_path), { recursive: true });

const file_path = path.resolve(data_path, "userSettings.json");
if (!fs.existsSync(file_path))
  fs.writeFileSync(file_path, JSON.stringify({}, null, 2), "utf8");

type userSettingsType = Record<string, string | string[] | number | boolean>;

function readFile() {
  if (fs.existsSync(file_path))
    return JSON.parse(fs.readFileSync(file_path, "utf8"));
  return {};
}

const writeFile = (data: userSettingsType) =>
  fs.writeFileSync(file_path, JSON.stringify(data, null, 2), "utf8");

async function save(userid: string, data: userSettingsType) {
  try {
    const settings = readFile();
    settings[userid] = data;
    writeFile(settings);
    return { success: true };
  } catch (err) {
    console.error("Save error:", err);
    return { success: false, error: err };
  }
}

async function read(userid: string) {
  try {
    const settings = readFile();
    const result = settings[userid] || null;
    return { success: true, result };
  } catch (err) {
    console.error("Read error:", err);
    return { success: false, error: err };
  }
}

async function del(userid: string) {
  try {
    const settings = readFile();
    if (settings.hasOwnProperty(userid)) {
      delete settings[userid];
      writeFile(settings);
    }
    return { success: true };
  } catch (err) {
    console.error("Delete error:", err);
    return { success: false, error: err };
  }
}

export { save, read, del };
