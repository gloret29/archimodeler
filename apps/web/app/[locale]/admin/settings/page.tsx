"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ARCHIMATE_CONCEPTS } from "@/lib/metamodel";
import { Link } from "@/navigation";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from '@/lib/api/client';

export default function AdminSettings() {
    const [githubConfig, setGithubConfig] = useState({
        repoOwner: "gloret29",
        repoName: "archimodeler-models",
        branch: "main",
        token: ""
    });

    const [neo4jConfig, setNeo4jConfig] = useState({
        uri: "bolt://localhost:7687",
        user: "neo4j",
        password: ""
    });

    const [paletteConfig, setPaletteConfig] = useState<string[]>([]);

    useEffect(() => {
        api.get('/settings')
            .then((data: any) => {
                if (Array.isArray(data)) {
                    const github = data.find((s: any) => s.key === 'github');
                    if (github && github.value) setGithubConfig(github.value);

                    const neo4j = data.find((s: any) => s.key === 'neo4j');
                    if (neo4j && neo4j.value) setNeo4jConfig(neo4j.value);

                    const palette = data.find((s: any) => s.key === 'palette');
                    if (palette && palette.value && Array.isArray(palette.value)) {
                        setPaletteConfig(palette.value);
                    } else {
                        // Default: all enabled
                        setPaletteConfig(ARCHIMATE_CONCEPTS.map(c => c.name));
                    }
                } else {
                    // If data is not an array, set defaults
                    setPaletteConfig(ARCHIMATE_CONCEPTS.map(c => c.name));
                }
            })
            .catch(err => {
                console.error("Failed to fetch settings:", err);
                // Set defaults on error
                setPaletteConfig(ARCHIMATE_CONCEPTS.map(c => c.name));
            });
    }, []);

    const handleSave = async (section: string) => {
        const key = section.toLowerCase();
        let value: any;
        
        if (section === 'GitHub') value = githubConfig;
        else if (section === 'Neo4j') value = neo4jConfig;
        else if (section === 'Palette') value = paletteConfig;

        try {
            const result = await api.post(`/settings/${key}`, {
                value,
                description: `${section} Configuration`
            });
            console.log(`${section} settings saved:`, result);
            alert(`${section} settings saved successfully!`);
        } catch (err: any) {
            console.error(`Error saving ${section} settings:`, err);
            alert(`Failed to save ${section} settings: ${err.message || 'Unknown error'}`);
        }
    };

    const toggleConcept = (name: string) => {
        setPaletteConfig(prev => 
            prev.includes(name) 
                ? prev.filter(c => c !== name) 
                : [...prev, name]
        );
    };

    const toggleAll = (enabled: boolean) => {
        if (enabled) {
            setPaletteConfig(ARCHIMATE_CONCEPTS.map(c => c.name));
        } else {
            setPaletteConfig([]);
        }
    };

    // Group concepts by layer for display
    const groupedConcepts = ARCHIMATE_CONCEPTS.reduce((acc, concept) => {
        if (!acc[concept.layer]) acc[concept.layer] = [];
        acc[concept.layer].push(concept);
        return acc;
    }, {} as Record<string, typeof ARCHIMATE_CONCEPTS>);

    const layerOrder = [
        'Strategy', 'Business', 'Application', 'Technology',
        'Physical', 'Motivation', 'Implementation & Migration', 'Composite'
    ];

    const t = useTranslations('Home');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage global application configuration.
                    </p>
                </div>
                <Link href="/home">
                    <Button variant="outline" title={t('backToHome')}>
                        <Home className="mr-2 h-4 w-4" />
                        {t('backToHome')}
                    </Button>
                </Link>
            </div>
            <Separator />

            <div className="grid gap-6">
                {/* Palette Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Palette Configuration</CardTitle>
                        <CardDescription>
                            Select which ArchiMate concepts are available in the modeling palette.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-4">
                            <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>Select All</Button>
                            <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>Deselect All</Button>
                        </div>
                        <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-6">
                                {layerOrder.map(layer => (
                                    <div key={layer} className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">{layer} Layer</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {groupedConcepts[layer]?.map(concept => (
                                                <div key={concept.name} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`concept-${concept.name}`} 
                                                        checked={paletteConfig.includes(concept.name)}
                                                        onCheckedChange={() => toggleConcept(concept.name)}
                                                    />
                                                    <Label 
                                                        htmlFor={`concept-${concept.name}`}
                                                        className="text-xs cursor-pointer"
                                                    >
                                                        {concept.name.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-2" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleSave("Palette")}>Save Palette Settings</Button>
                    </CardFooter>
                </Card>

                {/* GitHub Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>GitHub Integration</CardTitle>
                        <CardDescription>
                            Configure the GitHub repository used for model versioning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="repoOwner">Repository Owner</Label>
                                <Input
                                    id="repoOwner"
                                    value={githubConfig.repoOwner}
                                    onChange={(e) => setGithubConfig({ ...githubConfig, repoOwner: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repoName">Repository Name</Label>
                                <Input
                                    id="repoName"
                                    value={githubConfig.repoName}
                                    onChange={(e) => setGithubConfig({ ...githubConfig, repoName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branch">Default Branch</Label>
                            <Input
                                id="branch"
                                value={githubConfig.branch}
                                onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="token">Personal Access Token</Label>
                            <Input
                                id="token"
                                type="password"
                                value={githubConfig.token}
                                onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Token requires repo scope permissions.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleSave("GitHub")}>Save GitHub Settings</Button>
                    </CardFooter>
                </Card>

                {/* Neo4j Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Neo4j Database</CardTitle>
                        <CardDescription>
                            Connection details for the graph database engine.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="neo4jUri">Connection URI</Label>
                            <Input
                                id="neo4jUri"
                                value={neo4jConfig.uri}
                                onChange={(e) => setNeo4jConfig({ ...neo4jConfig, uri: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="neo4jUser">Username</Label>
                                <Input
                                    id="neo4jUser"
                                    value={neo4jConfig.user}
                                    onChange={(e) => setNeo4jConfig({ ...neo4jConfig, user: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neo4jPassword">Password</Label>
                                <Input
                                    id="neo4jPassword"
                                    type="password"
                                    value={neo4jConfig.password}
                                    onChange={(e) => setNeo4jConfig({ ...neo4jConfig, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline">Test Connection</Button>
                        <Button onClick={() => handleSave("Neo4j")}>Save Neo4j Settings</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}