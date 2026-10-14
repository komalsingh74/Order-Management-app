import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="gap-4 p-5">
      <CardContent className="flex flex-col items-start gap-4 p-0">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">That page doesn&apos;t exist. Head back to the menu to place an order.</p>
        <Button render={<Link href="/">Browse menu</Link>} />
      </CardContent>
    </Card>
  );
}
