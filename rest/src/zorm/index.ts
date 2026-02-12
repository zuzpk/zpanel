import { PushTokens } from "./push_tokens";
import { Settings } from "./settings";
import { Users } from "./users";
import { UsersSess } from "./users_sess";
import Zorm from "@zuzjs/orm";
import de from "dotenv";
de.config()
const zormEntities = [PushTokens, Settings, Users, UsersSess];
const zorm = Zorm.get(
	process.env.DATABASE_URL!,
	zormEntities
);
zorm.connect(zormEntities);
export default zorm
export { PushTokens, Settings, Users, UsersSess }