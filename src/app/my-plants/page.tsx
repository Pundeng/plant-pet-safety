import Link from "next/link";
import MyPlantsList from "../../components/MyPlantsList";

export default function MyPlantsPage() {
  return (
    <main>
      <Link href="/">← Back to analyzer</Link>
      <h1>My Plants</h1>
      <p>Plants you saved from previous analysis results.</p>
      <MyPlantsList />
    </main>
  );
}
