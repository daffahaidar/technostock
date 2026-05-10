import { BeatLoader } from "react-spinners";

export default function Loading() {
  return (
    <section className="flex h-screen flex-1 flex-col items-center justify-center">
      <BeatLoader color="var(--primary)" size={20} />
    </section>
  );
}
