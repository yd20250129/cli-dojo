import { buildQuestionCatalog } from "@/lib/shared/catalog";
import { sec04QuestionDefs } from "@/data/question-defs/sec04";
import sec04Ja from "@/locales/ja/questions/sec04.json";

export const sec04Questions = buildQuestionCatalog(sec04QuestionDefs, sec04Ja);
