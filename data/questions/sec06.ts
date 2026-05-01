import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec06QuestionDefs } from "@/data/question-defs/sec06";
import sec06Ja from "@/locales/ja/questions/sec06.json";

export const sec06Questions = buildQuestionCatalog(sec06QuestionDefs, sec06Ja);
