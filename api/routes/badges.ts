import router from "$lib/routerV2";

import fs from "fs";
import path from "path";

import dirTree from "directory-tree";

interface DirTreeNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: DirTreeNode[];
}

const tree: DirTreeNode = dirTree(path.resolve(".", "badges"), {
  extensions: /\./,
});

const RequestRouter = new router("badges");

const CDN_URL = "https://cdn.unii.dev/";

RequestRouter.add(
  "GET",
  "/",
  async (req, res) => {
    if (!tree.children || !CDN_URL)
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
                    acc[imgs.name] = ["1x", "2x", "3x", "4x"].reduce<
                      Record<string, string>
                    >((acc, s) => {
                      acc[s] =
                        CDN_URL +
                        path.join(
                          "badges",
                          badge_parent.name,
                          badge.name,
                          imgs.name,
                          s + ".webp",
                        );

                      return acc;
                    }, {});
                  return acc;
                }, {}) ?? {},
              type: badge_parent.name + " Badge",
              ...JSON.parse(
                fs.readFileSync(path.resolve(badge.path, "badge.json"), "utf8"),
              ),
            };
          }) ?? [];
        return acc;
      },
      {},
    );

    res.json(mapped_badges);
  },
  { cors: false },
);

export default RequestRouter;
