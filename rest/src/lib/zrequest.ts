import { DEFAULT_LANG } from "@/config";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load all language files once at startup
const LANGS_DIR = path.join(__dirname, "..", "app", "langs");
const languages: Record<string, Record<string, string>> = {};

// Preload languages into memory
fs.readdirSync(LANGS_DIR).forEach((file) => {
  if (!file.startsWith(`_`) && file.endsWith(".js")) {
    const langCode = path.basename(file, path.extname(file));
    languages[langCode] = require(path.join(LANGS_DIR, file)).default;
  }
});

export const withZuzRequest = async (req: Request, res: Response, next: NextFunction) => {

  const langCode = req.signedCookies.lang || DEFAULT_LANG;
  req.lang = languages[langCode] || languages[DEFAULT_LANG]!;

  next()
        
}