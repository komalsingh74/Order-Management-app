import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusStepper from "./StatusStepper";

describe("StatusStepper", () => {
  it("renders the four delivery steps", () => {
    render(<StatusStepper status="RECEIVED" />);
    ["Order received", "Preparing", "Out for delivery", "Delivered"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });

  it("marks only the current step with aria-current", () => {
    render(<StatusStepper status="PREPARING" />);
    const current = screen.getAllByRole("listitem").filter((li) => li.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Preparing");
  });

  it("shows earlier steps as done and later steps as upcoming", () => {
    render(<StatusStepper status="OUT_FOR_DELIVERY" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-state", "done");
    expect(items[1]).toHaveAttribute("data-state", "done");
    expect(items[2]).toHaveAttribute("data-state", "current");
    expect(items[3]).toHaveAttribute("data-state", "upcoming");
  });

  it("treats DELIVERED as fully complete", () => {
    render(<StatusStepper status="DELIVERED" />);
    screen.getAllByRole("listitem").forEach((li) => expect(li).toHaveAttribute("data-state", "done"));
  });
});
