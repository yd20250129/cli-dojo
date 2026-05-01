import { buildSectionCatalog } from "@/lib/shared/catalog";
import { sectionDefs } from "@/data/section-defs";
import jaSections from "@/locales/ja/sections.json";

export const sections = buildSectionCatalog(sectionDefs, jaSections);
