import SeriesForm from "@/components/SeriesForm";
import SeriesList from "@/components/SeriesList";

export const metadata = {
    title: "Track - MangaVerse",
    description: "Keep track of your reading progress.",
};

export default function TrackPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-8">
            <h1 className="Heading-lg text-3xl mb-8 text-foreground">Track Your Journey</h1>
            <SeriesForm />
            <SeriesList />
        </div>
    );
}
