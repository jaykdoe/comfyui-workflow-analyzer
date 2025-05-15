"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, ExternalLink } from "lucide-react"

interface ModelListProps {
  models: {
    name: string
    type: string
    path?: string
    version?: string
    format?: string
    source?: string
    count: number
    nodes: string[]
  }[]
}

export function ModelList({ models }: ModelListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (!models || models.length === 0) {
    return <div className="text-center py-8 text-gray-400">No model data found in this workflow</div>
  }

  const filteredModels = models.filter(
    (model) =>
      (typeof model.name === "string"
        ? model.name.toLowerCase().includes(searchTerm.toLowerCase())
        : String(model.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      model.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.source && model.source.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getModelTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "checkpoint":
      case "unet":
        return "bg-purple-900 hover:bg-purple-800"
      case "vae":
        return "bg-blue-900 hover:bg-blue-800"
      case "lora":
        return "bg-pink-900 hover:bg-pink-800"
      case "controlnet":
        return "bg-green-900 hover:bg-green-800"
      case "clip":
        return "bg-yellow-900 hover:bg-yellow-800"
      default:
        return "bg-gray-800 hover:bg-gray-700"
    }
  }

  const getModelDownloadLink = (model: any) => {
    const modelName = typeof model.name === "string" ? model.name.toLowerCase() : String(model.name).toLowerCase()
    const modelType = model.type.toLowerCase()

    // Determine the most likely source based on model name and type
    if (modelName.includes("sd_")) {
      return "https://huggingface.co/models?search=stable+diffusion"
    } else if (modelName.includes("flux")) {
      return "https://huggingface.co/models?search=flux"
    } else if (modelType === "lora") {
      return "https://civitai.com/models?type=LORA"
    } else if (modelType === "controlnet") {
      return "https://huggingface.co/models?search=controlnet"
    } else if (modelType === "vae") {
      return "https://huggingface.co/models?search=vae"
    } else if (modelType === "clip") {
      return "https://huggingface.co/models?search=clip"
    }

    // Default to Civitai search with the model name
    return `https://civitai.com/models?query=${encodeURIComponent(model.name)}`
  }

  const getModelInfoLink = (model: any) => {
    const modelName = model.name.toLowerCase()
    const modelType = model.type.toLowerCase()

    // ComfyUI documentation links
    if (modelType === "checkpoint" || modelType === "unet") {
      return "https://comfyanonymous.github.io/ComfyUI_examples/model/"
    } else if (modelType === "vae") {
      return "https://comfyanonymous.github.io/ComfyUI_examples/vae/"
    } else if (modelType === "clip") {
      return "https://comfyanonymous.github.io/ComfyUI_examples/clip/"
    } else if (modelType === "controlnet") {
      return "https://comfyanonymous.github.io/ComfyUI_examples/controlnet/"
    } else if (modelType === "lora") {
      return "https://comfyanonymous.github.io/ComfyUI_examples/lora/"
    }

    // Default to general models documentation
    return "https://comfyanonymous.github.io/ComfyUI_examples/model/"
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search models..."
          className="pl-8 bg-gray-800 border-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map((model, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge className={`${getModelTypeColor(model.type)}`}>{model.type}</Badge>
                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                  Used {model.count} {model.count === 1 ? "time" : "times"}
                </Badge>
              </div>
              <CardTitle className="text-white mt-2 truncate" title={model.name}>
                {model.name}
              </CardTitle>
              {model.path && (
                <CardDescription className="text-gray-400 truncate" title={model.path}>
                  {model.path}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400 mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {model.version && (
                    <div>
                      <span className="text-gray-500">Version:</span> {model.version}
                    </div>
                  )}
                  {model.format && (
                    <div>
                      <span className="text-gray-500">Format:</span> {model.format}
                    </div>
                  )}
                  {model.source && (
                    <div>
                      <span className="text-gray-500">Source:</span> {model.source}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-medium mb-1">Used in nodes:</div>
                  <div className="flex flex-wrap gap-1">
                    {model.nodes.slice(0, 3).map((node, i) => (
                      <Badge key={i} variant="outline" className="bg-gray-800 border-gray-700">
                        {node}
                      </Badge>
                    ))}
                    {model.nodes.length > 3 && (
                      <Badge variant="outline" className="bg-gray-800 border-gray-700">
                        +{model.nodes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <a
                    href={getModelInfoLink(model)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Documentation <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={getModelDownloadLink(model)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Find Model <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
