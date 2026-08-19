import { removeVisibleAsterisks } from "@/lib/textSanitizers";

export function AskAICard({
  coachQuestion,
  setCoachQuestion,
  coachAnswer,
  isCoachLoading,
  askFitCheckAILLM,
  activeConversationLabel,
  activeConversationQuestion,
  clearActiveConversation,
}: {
  coachQuestion: string;
  setCoachQuestion: (value: string) => void;
  coachAnswer: string;
  isCoachLoading: boolean;
  askFitCheckAILLM: () => void;
  activeConversationLabel?: string | null;
  activeConversationQuestion?: string | null;
  clearActiveConversation: () => void;
}) {
  const isReopenedChat = Boolean(activeConversationLabel);
  const chatMessages = buildChatMessages({
    question: activeConversationQuestion,
    answer: coachAnswer,
  });

  return (
    <section
      id="ask-fitcheck-ai"
      className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <details open={isReopenedChat}>
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Secondary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Ask FitCheck AI
              </h2>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Free-form chat
            </span>
          </div>
        </summary>

        {isReopenedChat && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Current chat
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-950">
                  {activeConversationLabel}
                </p>
              </div>

              <button
                onClick={clearActiveConversation}
                className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700"
              >
                New chat
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-blue-800">
              Continue this saved chat below, or start a fresh one.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            value={coachQuestion}
            onChange={(event) => setCoachQuestion(event.target.value)}
            placeholder={
              isReopenedChat
                ? "Ask FitCheck AI..."
                : "Example: Am I on track to reach my goal?"
            }
          />

          <button
            onClick={askFitCheckAILLM}
            disabled={isCoachLoading}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isCoachLoading
              ? "Thinking..."
              : "Ask AI"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-950">
            {isReopenedChat ? "Ask FitCheck AI Chat" : "FitCheck AI Response"}
          </p>
          <div className="mt-4 space-y-3">
            {chatMessages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                message={message}
              />
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

type ChatMessage = {
  role: "You" | "FitCheck AI";
  content: string;
};

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "You";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[78%] ${
          isUser
            ? "rounded-br-md bg-slate-950 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
        }`}
      >
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            isUser ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {message.role}
        </p>
        <p className="mt-2 whitespace-pre-line">
          {removeVisibleAsterisks(message.content)}
        </p>
      </div>
    </div>
  );
}

function buildChatMessages({
  question,
  answer,
}: {
  question?: string | null;
  answer: string;
}) {
  const messages: ChatMessage[] = [];

  if (question?.trim()) {
    messages.push({ role: "You", content: removeVisibleAsterisks(question) });
  }

  const lines = answer.split("\n");
  let currentRole: ChatMessage["role"] = "FitCheck AI";
  let currentLines: string[] = [];

  const flushMessage = () => {
    const content = currentLines.join("\n").trim();
    if (content) {
      messages.push({
        role: currentRole,
        content: removeVisibleAsterisks(content),
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const userMatch = line.match(/^You:\s*(.*)$/i);
    const aiMatch = line.match(/^FitCheck AI:\s*(.*)$/i);

    if (userMatch) {
      flushMessage();
      currentRole = "You";
      currentLines = [userMatch[1]];
      continue;
    }

    if (aiMatch) {
      flushMessage();
      currentRole = "FitCheck AI";
      currentLines = [aiMatch[1]];
      continue;
    }

    currentLines.push(line);
  }

  flushMessage();

  return messages;
}
