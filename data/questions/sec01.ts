import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec01QuestionDefs } from "@/data/question-defs/sec01";
import sec01Ja from "@/locales/ja/questions/sec01.json";

export const sec01Questions = buildQuestionCatalog(sec01QuestionDefs, sec01Ja);
