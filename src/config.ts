import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  openTargetsApiUrl:
    process.env.OPEN_TARGETS_API ||
    "https://api.platform.opentargets.org/api/v4/graphql",
  logLevel: process.env.LOG_LEVEL || "info",
  mcpDebug: process.env.MCP_DEBUG === "true" || false,
};
