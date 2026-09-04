import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";

export default function Home() {
  return (
    <main>
      <h1>Plant Pet Safety</h1>
      <p>Upload a photo to check if a plant is safe for your pets.</p>
      <p>
        <Link href="/my-plants">View My Plants</Link>
      </p>

      <ImageUploader />
    </main>
  );
}
