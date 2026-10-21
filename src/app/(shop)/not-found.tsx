import { NotFoundContent } from "@/components/not-found-content";

// For notFound() in shop pages (unknown category, brand or product); the shop layout adds the shell.
export default function ShopNotFound() {
  return <NotFoundContent />;
}
