import MenuList from "@/components/MenuList";

export default function MenuPage() {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Today&apos;s menu</h1>
      <p className="mb-5 text-muted-foreground">Pick what you like. We&apos;ll cook it fresh and bring it over.</p>
      <MenuList />
    </>
  );
}
