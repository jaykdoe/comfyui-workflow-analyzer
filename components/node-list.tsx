"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface NodeListProps {
  nodes: any[]
}

export function NodeList({ nodes }: NodeListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("grid")

  if (!nodes || nodes.length === 0) {
    return <div className="text-center py-8 text-gray-400">No node data found in this workflow</div>
  }

  // Get unique categories
  const categories = Array.from(new Set(nodes.map((node) => node.category)))

  // Filter nodes based on search and category
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      searchTerm === "" ||
      (typeof node.type === "string" && node.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.title && typeof node.title === "string" && node.title.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === null || node.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Get documentation link for a node
  const getNodeDocLink = (nodeType: string) => {
    // Base documentation URLs for different node types
    const docLinks: Record<string, string> = {
      KSampler: "https://comfyanonymous.github.io/ComfyUI_examples/samplers/",
      VAEDecode: "https://comfyanonymous.github.io/ComfyUI_examples/vae/",
      VAEEncode: "https://comfyanonymous.github.io/ComfyUI_examples/vae/",
      CLIPTextEncode: "https://comfyanonymous.github.io/ComfyUI_examples/clip/",
      LoadImage: "https://comfyanonymous.github.io/ComfyUI_examples/loaders/",
      SaveImage: "https://comfyanonymous.github.io/ComfyUI_examples/io/",
      PreviewImage: "https://comfyanonymous.github.io/ComfyUI_examples/io/",
    }

    // Check if we have a specific doc link for this node type
    if (nodeType in docLinks) {
      return docLinks[nodeType]
    }

    // Generic documentation link
    return "https://comfyanonymous.github.io/ComfyUI_examples/"
  }

  // Get node type color
  const getNodeTypeColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      Loaders: "bg-blue-900 hover:bg-blue-800",
      Samplers: "bg-purple-900 hover:bg-purple-800",
      VAE: "bg-indigo-900 hover:bg-indigo-800",
      CLIP: "bg-yellow-900 hover:bg-yellow-800",
      Models: "bg-green-900 hover:bg-green-800",
      "Image Processing": "bg-cyan-900 hover:bg-cyan-800",
      Output: "bg-orange-900 hover:bg-orange-800",
      Effects: "bg-pink-900 hover:bg-pink-800",
      "Text/Prompts": "bg-red-900 hover:bg-red-800",
      ControlNet: "bg-emerald-900 hover:bg-emerald-800",
      LoRA: "bg-violet-900 hover:bg-violet-800",
    }

    return categoryColors[category] || "bg-gray-800 hover:bg-gray-700"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search nodes..."
            className="pl-8 bg-gray-800 border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            className={`cursor-pointer ${categoryFilter === null ? "bg-purple-700" : "bg-gray-700"}`}
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              className={`cursor-pointer ${categoryFilter === category ? getNodeTypeColor(category) : "bg-gray-700"}`}
              onClick={() => setCategoryFilter(category === categoryFilter ? null : category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="grid" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="grid" className="data-[state=active]:bg-gray-700">
            Grid View
          </TabsTrigger>
          <TabsTrigger value="table" className="data-[state=active]:bg-gray-700">
            Table View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNodes.map((node, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className={getNodeTypeColor(node.category)}>{node.category}</Badge>
                    <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                      ID: {node.id}
                    </Badge>
                  </div>
                  <CardTitle className="text-white mt-2 truncate" title={node.type}>
                    {node.type}
                  </CardTitle>
                  {node.title && node.title !== node.type && (
                    <CardDescription className="text-gray-400 truncate" title={node.title}>
                      {node.title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-400 mt-2 space-y-3">
                    {node.properties && Object.keys(node.properties).length > 0 && (
                      <div>
                        <div className="font-medium mb-1">Properties:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(node.properties)
                            .slice(0, 4)
                            .map(([key, value]: [string, any], i) => (
                              <div key={i} className="truncate" title={`${key}: ${value}`}>
                                <span className="text-gray-500">{key}:</span> {String(value)}
                              </div>
                            ))}
                          {Object.keys(node.properties).length > 4 && (
                            <div className="text-gray-500">+{Object.keys(node.properties).length - 4} more</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-gray-800 border-gray-700">
                          In: {node.inputs.length}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-800 border-gray-700">
                          Out: {node.outputs.length}
                        </Badge>
                      </div>
                      <a
                        href={getNodeDocLink(node.type)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <div className="rounded-md border border-gray-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-800">
                <TableRow className="hover:bg-gray-800/50 border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Inputs</TableHead>
                  <TableHead className="text-gray-300">Outputs</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.map((node) => (
                  <TableRow key={node.id} className="hover:bg-gray-800/50 border-gray-700">
                    <TableCell className="font-medium">{node.id}</TableCell>
                    <TableCell>{node.type}</TableCell>
                    <TableCell>
                      <Badge className={getNodeTypeColor(node.category)}>{node.category}</Badge>
                    </TableCell>
                    <TableCell>{node.inputs.length}</TableCell>
                    <TableCell>{node.outputs.length}</TableCell>
                    <TableCell>
                      <a
                        href={getNodeDocLink(node.type)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
