import router from "$lib/router";

import fs from "fs";
import path from "path";

import dirTree from "directory-tree";

interface DirTreeNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: DirTreeNode[];
}

const tree: DirTreeNode = dirTree(path.join(process.cwd(), "badges"), {
  extensions: /\./,
});

const RequestRouter = router();

const CDN_URL = process.env.CDN_URL;

RequestRouter.add("GET", "/", async (req, res) => {
  if (!tree.children)
    return res.status(500).json({ message: "No badges found!", error: true });
  const mapped_badges = tree.children.reduce<Record<string, any>>(
    (acc, badge_parent) => {
      if (!badge_parent.children) return acc;
      acc[badge_parent.name] =
        badge_parent.children.map((badge) => {
          if (!badge.children) return {};
          return {
            id: badge.name,
            imgs:
              badge.children.reduce<Record<string, any>>((acc, imgs) => {
                if (imgs.children)
                  acc[imgs.name] =
                    imgs.children.reduce<Record<string, string>>((acc, img) => {
                      acc[img.name.split(".")[0] as string] =
                        CDN_URL +
                        path.join(
                          "badges",
                          badge_parent.name,
                          badge.name,
                          imgs.name,
                          img.name,
                        );
                      return acc;
                    }, {}) ?? {};
                return acc;
              }, {}) ?? {},
            type: badge_parent.name + " Badge",
            ...JSON.parse(
              fs.readFileSync(path.join(badge.path, "badge.json"), "utf8"),
            ),
          };
        }) ?? [];
      return acc;
    },
    {},
  );

  res.json(mapped_badges);
});

export default RequestRouter;
