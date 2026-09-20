import { createLibrarySchema } from "@lucaengelhard/libttrpg";
import { DND_SCHEMATA } from "../components/index.ts";

console.log(
  JSON.stringify(createLibrarySchema(...DND_SCHEMATA).toJSONSchema()),
);
