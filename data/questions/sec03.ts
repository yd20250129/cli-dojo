import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec03QuestionDefs } from "@/data/question-defs/sec03";
import sec03Ja from "@/locales/ja/questions/sec03.json";

export const sec03Questions = buildQuestionCatalog(sec03QuestionDefs, sec03Ja);
