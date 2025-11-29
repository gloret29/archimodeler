"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

    useEffect(() => {
        fetch('http://localhost:3002/settings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const github = data.find((s: any) => s.key === 'github');
                    if (github && github.value) setGithubConfig(github.value);

                    const neo4j = data.find((s: any) => s.key === 'neo4j');
                    if (neo4j && neo4j.value) setNeo4jConfig(neo4j.value);
                }
            })
            .catch(err => console.error("Failed to fetch settings:", err));
    }, []);

    const handleSave = async (section: string) => {
        const key = section.toLowerCase();
        const value = section === 'GitHub' ? githubConfig : neo4jConfig;

        try {
            const res = await fetch(`http://localhost:3002/settings/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, description: `${section} Configuration` })
            });

            if (res.ok) {
                alert(`${section} settings saved!`);
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to save ${section} settings`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage global application configuration.
                </p>
            </div>
            <Separator />

            <div className="grid gap-6">
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
