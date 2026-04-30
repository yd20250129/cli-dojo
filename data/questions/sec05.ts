import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec05QuestionDefs } from "@/data/question-defs/sec05";
import sec05Ja from "@/locales/ja/questions/sec05.json";

export const sec05Questions = buildQuestionCatalog(sec05QuestionDefs, sec05Ja);
