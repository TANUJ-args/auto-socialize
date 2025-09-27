import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "auto-publisher",
  { minutes: 1 },
  internal.publisher.publishScheduledPosts,
);

export default crons;