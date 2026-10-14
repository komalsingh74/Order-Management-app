import { formatTime } from "@/lib/format";
import { STATUS_STEPS } from "@/lib/orderStatus";
import type { OrderStatus, StatusHistoryEntry } from "@/lib/types";

interface Props {
  status: OrderStatus;
  history?: StatusHistoryEntry[];
}

export default function StatusStepper({ status, history = [] }: Props) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="my-2 list-none p-0" aria-label="Order progress">
      {STATUS_STEPS.map((step, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        // Last time this status was entered.
        const reachedAt = [...history].reverse().find((h) => h.status === step.status)?.at;
        // A delivered order has nothing left to wait for.
        const finished = status === "DELIVERED" && index === currentIndex;

        const isDone = finished || state === "done";

        return (
          <li
            key={step.status}
            data-state={finished ? "done" : state}
            className={`relative flex gap-4 pb-7 last:pb-0 before:absolute before:bottom-0 before:left-[13px] before:top-7 before:w-1 before:rounded-full before:content-[''] last:before:hidden ${
              isDone
                ? "before:bg-primary"
                : "before:bg-[repeating-linear-gradient(to_bottom,var(--border)_0_6px,transparent_6px_12px)]"
            }`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span
              className={`relative z-10 h-7 w-7 shrink-0 rounded-full border-4 ${
                isDone
                  ? "border-primary bg-primary"
                  : state === "current"
                    ? "animate-pulse border-accent bg-accent"
                    : "border-border bg-card"
              }`}
              aria-hidden="true"
            />
            <div>
              <p className={`font-bold ${state === "upcoming" ? "text-muted-foreground" : ""}`}>
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {state === "upcoming" ? step.hint : reachedAt ? `${formatTime(reachedAt)} · ${step.hint}` : step.hint}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
