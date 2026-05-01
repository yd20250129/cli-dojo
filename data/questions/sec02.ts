import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec02QuestionDefs } from "@/data/question-defs/sec02";
import sec02Ja from "@/locales/ja/questions/sec02.json";

export const sec02Questions = buildQuestionCatalog(sec02QuestionDefs, sec02Ja);
