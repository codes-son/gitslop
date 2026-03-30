import { Router, type IRouter, type Request, type Response } from "express";
import { getMemeImageBuffer } from "../lib/image-upload.js";

const router: IRouter = Router();

router.get("/meme-images/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!/^[0-9a-f-]{36}$/.test(id)) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }

  try {
    const buffer = await getMemeImageBuffer(id);
    res.set({
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000",
    });
    res.send(buffer);
  } catch {
    res.status(404).json({ error: "Image not found" });
  }
});

export default router;
