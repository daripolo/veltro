import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("crypto listener all", { minutes: 15 }, internal.listeners.poller.pollAllChains);

export default crons;
