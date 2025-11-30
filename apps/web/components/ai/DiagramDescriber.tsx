import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_CONFIG } from '@/lib/api/config';

export default function DiagramDescriber({ nodes, edges }: { nodes: any[], edges: any[] }) {
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await API_CONFIG.fetch("/ai/describe", {
                method: "POST",
                body: JSON.stringify({ nodes, edges }),
            });
            const data = await res.text();
            setDescription(data);
        } catch (err) {
            console.error(err);
            setDescription("Failed to generate description.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Describe Diagram
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>AI Diagram Description</DialogTitle>
                    <DialogDescription>
                        Generate a natural language description of this view using GenAI.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {!description && !loading && (
                        <div className="flex justify-center">
                            <Button onClick={handleGenerate}>Generate Description</Button>
                        </div>
                    )}
                    {loading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-pulse text-muted-foreground">Generating analysis...</div>
                        </div>
                    )}
                    {description && (
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/50">
                            <div className="whitespace-pre-wrap text-sm">{description}</div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
