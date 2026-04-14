import router from "$lib/router";

const RequestRouter = router();

import crypto from "crypto";
import { exec } from "child_process";
import type { ExecException } from "child_process";

const SECRET = process.env.GITHUB_WEBHOOK_SECRET;

async function verifySignature(signature: string | null, rawBody: string) {
  if (!signature || !SECRET) return false;

  const hmac = crypto.createHmac("sha256", SECRET);
  const digest = "sha256=" + hmac.update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

async function deploy() {
  try {
    await new Promise((resolve: Function, reject: Function) => {
      if (process.env.UCHAT_DEPLOY_PATH)
        exec(
          process.env.UCHAT_DEPLOY_PATH,
          undefined,
          (err: ExecException | null, stdout, stderr) => {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            if (err) return reject(err);
            resolve();
          },
        );
    });

    if (process.env.CLOUDFLARE_PURGE_PATH) {
      const cfRes = await fetch(process.env.CLOUDFLARE_PURGE_PATH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purge_everything: true }),
      });

      const data = await cfRes.json();

      if (!data.success) {
        console.error("Cloudflare purge failed", data);
      } else {
        console.log("Cloudflare cache has been purged!");
      }
    }
  } catch (err) {
    console.error("Deploy failed:", err);
  }
}

RequestRouter.add("POST", "/", async (req, res) => {
  const rawBody = await req.text();
  const signature_header = req.headers.get("x-hub-signature-256");

  if (!signature_header || !rawBody)
    return res.status(401).send("No body or header");

  if (!(await verifySignature(signature_header, rawBody)))
    return res.status(401).send("Invalid signature");

  const payload = JSON.parse(await req.json().toString());
  const ref = payload.ref;
  const pusher = payload.pusher.name;

  console.log("Push detected on:", ref);
  console.log("By:", pusher);

  if (ref === "refs/heads/main" && pusher.toLowerCase().includes("actions")) {
    deploy();

    console.log("Deplying");
    return res.send("Deployed!");
  }

  return res.send("Webhook processed");
});

module.exports = router;
