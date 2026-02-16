import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    content: ReactNode;
}

interface SettingsLayoutProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    tabs: SettingsTab[];
}

export function SettingsLayout({ activeTab, onTabChange, tabs }: SettingsLayoutProps) {
    return (
        <div className="flex gap-6 h-full">
            {/* Left Sidebar - Settings Navigation */}
            <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border p-4">
                    <h2 className="text-lg font-semibold mb-4">Settings</h2>
                    <nav className="space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                                        activeTab === tab.id
                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Right Content - Settings Module */}
            <div className="flex-1">
                <div className="bg-white rounded-lg border p-6">
                    {tabs.find(tab => tab.id === activeTab)?.content}
                </div>
            </div>
        </div>
    );
}
