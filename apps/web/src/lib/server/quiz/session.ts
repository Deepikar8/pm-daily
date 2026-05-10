export function quizSessionName(args: {
  userId: string;
  date: string;
  sessionId?: string | null;
}): string {
  if (!args.sessionId || args.sessionId === "default") {
    return `${args.userId}:${args.date}`;
  }
  return `${args.userId}:${args.date}:${args.sessionId}`;
}

