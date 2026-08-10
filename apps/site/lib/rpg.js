import "server-only";

// This file is intentionally server-only: no physical path or SQL reaches the browser.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const database = require("../../../packages/database");
export default database;
