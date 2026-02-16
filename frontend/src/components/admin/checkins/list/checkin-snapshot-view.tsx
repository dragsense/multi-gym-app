// External Libraries
import React, { useState } from "react";

// Utils
import { buildSentence } from "@/locales/translations";

// Types
export interface ISnapshot {
    id: string;
    sequence: number;
    image?: {
        id: string;
        url: string;
        name: string;
    } | null;
}

interface ISnapshotsGridProps {
    snapshots?: ISnapshot[];
    t: (key: string) => string;
}

// Snapshots Grid Component with Enhanced Lightbox
export function SnapshotsGrid({ snapshots, t }: ISnapshotsGridProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Handle no snapshots case
    if (!snapshots || snapshots.length === 0) {
        return (
            <div className="border rounded-lg p-8 bg-muted/20">
                <p className="text-sm text-muted-foreground text-center">
                    {buildSentence(t, "no", "snapshots", "available")}
                </p>
            </div>
        );
    }

    // Sort snapshots by sequence number and filter those with valid images
    const sortedSnapshots = [...snapshots].sort((a, b) => a.sequence - b.sequence);
    const validSnapshots = sortedSnapshots.filter(s => s.image?.url);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null && selectedIndex < validSnapshots.length - 1) {
            setSelectedIndex(selectedIndex + 1);
        }
    };

    const selectedSnapshot = selectedIndex !== null ? validSnapshots[selectedIndex] : null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSnapshots.map((snapshot) => (
                    <div
                        key={snapshot.id}
                        className="group relative border rounded-lg overflow-hidden bg-muted/20 aspect-video cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
                        onClick={() => {
                            if (snapshot.image?.url) {
                                const validIndex = validSnapshots.findIndex(s => s.id === snapshot.id);
                                setSelectedIndex(validIndex >= 0 ? validIndex : null);
                            }
                        }}
                    >
                        {snapshot.image?.url ? (
                            <>
                                <img
                                    src={snapshot.image.url}
                                    alt={`${buildSentence(t, "snapshot")} ${snapshot.sequence}`}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const errorDiv = document.createElement("div");
                                            errorDiv.className =
                                                "flex items-center justify-center h-full text-muted-foreground";
                                            errorDiv.innerHTML = `<span class="text-xs">${buildSentence(t, "image", "not", "available")}</span>`;
                                            parent.appendChild(errorDiv);
                                        }
                                    }}
                                />
                                {/* Sequence Badge */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                    {snapshot.sequence}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/30">
                                <span className="text-xs">{buildSentence(t, "no", "image")}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Enhanced Lightbox Modal */}
            {selectedSnapshot && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedIndex(null)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-6 right-6 z-10 bg-muted hover:bg-muted/80 text-foreground p-2.5 rounded-full transition-all duration-200 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-6 left-6 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        {selectedIndex !== null ? selectedIndex + 1 : 1} / {validSnapshots.length}
                    </div>

                    {/* Navigation Arrows */}
                    {selectedIndex !== null && selectedIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="absolute left-6 top-1/2 -translate-y-1/2 bg-muted hover:bg-muted/80 text-foreground p-3 rounded-full transition-all duration-200 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                    )}

                    {selectedIndex !== null && selectedIndex < validSnapshots.length - 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-6 top-1/2 -translate-y-1/2 bg-muted hover:bg-muted/80 text-foreground p-3 rounded-full transition-all duration-200 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    )}

                    {/* Main Image Container */}
                    <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <div className="border rounded-xl overflow-hidden shadow-2xl bg-card">
                            <img
                                src={selectedSnapshot.image?.url}
                                alt={`${buildSentence(t, "snapshot")} ${selectedSnapshot.sequence}`}
                                className="max-w-[60vw] max-h-[55vh] object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>
                        {/* Image Caption */}
                        <div className="mt-4">
                            <span className="bg-muted text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-md">
                                {buildSentence(t, "snapshot")} {selectedSnapshot.sequence}
                            </span>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {validSnapshots.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-lg">
                            {validSnapshots.map((snap, idx) => (
                                <button
                                    key={snap.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedIndex(idx);
                                    }}
                                    className={`w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${idx === selectedIndex
                                        ? "border-white opacity-100"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <img
                                        src={snap.image?.url}
                                        alt={`Thumbnail ${snap.sequence}`}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default SnapshotsGrid;
