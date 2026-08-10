"use strict";
const provider = (process.env.DATABASE_PROVIDER || "sqlite").trim().toLowerCase();
if (!['sqlite', 'postgres'].includes(provider)) throw new Error("DATABASE_PROVIDER deve ser sqlite ou postgres.");
module.exports = { provider };
