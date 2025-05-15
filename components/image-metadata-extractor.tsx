"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, FileJson, Code, Download } from "lucide-react"
import { parseComfyWorkflow } from "@/lib/workflow-parser"
import { exportImageMetadata } from "@/lib/export-utils"

export function ImageMetadataExtractor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [parsedWorkflow, setParsedWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    setLoading(true)
    setError(null)
    setMetadata(null)
    setParsedWorkflow(null)

    // Create a URL for the image
    const objectUrl = URL.createObjectURL(file)
    setImageUrl(objectUrl)

    // Extract metadata from the image
    extractMetadata(file)
      .then((data) => {
        setMetadata(data)

        // If we have workflow data, try to parse it
        if (data?.workflow) {
          try {
            const workflowData = typeof data.workflow === "string" ? JSON.parse(data.workflow) : data.workflow
            const parsed = parseComfyWorkflow(workflowData)
            setParsedWorkflow(parsed)
          } catch (err) {
            console.error("Failed to parse workflow from metadata:", err)
          }
        }
      })
      .catch((err) => {
        console.error("Error extracting metadata:", err)
        setError("Failed to extract metadata from the image: " + err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const extractMetadata = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      // First, get the image dimensions
      const img = new Image()
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height }

        // Now read the file as an ArrayBuffer to parse PNG chunks
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            if (!event.target?.result) {
              throw new Error("Failed to read file")
            }

            const buffer = event.target.result as ArrayBuffer
            const metadata = extractPngMetadata(buffer)

            resolve({
              dimensions,
              ...metadata,
            })
          } catch (err) {
            console.error("Error processing PNG metadata:", err)
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsArrayBuffer(file)
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const extractPngMetadata = (buffer: ArrayBuffer): any => {
    const view = new DataView(buffer)
    const signature = [137, 80, 78, 71, 13, 10, 26, 10] // PNG signature

    // Check PNG signature
    for (let i = 0; i < signature.length; i++) {
      if (view.getUint8(i) !== signature[i]) {
        throw new Error("Not a valid PNG file")
      }
    }

    let offset = 8 // Skip signature
    const chunks: any = {}
    let workflow = null
    let prompt = null
    let negativePrompt = null
    const parameters: any = {}
    const allTextInputs: any[] = []

    // Parse PNG chunks
    while (offset < view.byteLength) {
      const length = view.getUint32(offset)
      offset += 4

      // Get chunk type as string
      const typeBytes = [
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
      ]
      const type = String.fromCharCode(...typeBytes)
      offset += 4

      // Process tEXt chunks which may contain ComfyUI metadata
      if (type === "tEXt") {
        let keyEnd = offset
        while (view.getUint8(keyEnd) !== 0 && keyEnd < offset + length) {
          keyEnd++
        }

        const keyBytes = new Uint8Array(buffer.slice(offset, keyEnd))
        const key = new TextDecoder().decode(keyBytes)

        const valueBytes = new Uint8Array(buffer.slice(keyEnd + 1, offset + length))
        const value = new TextDecoder().decode(valueBytes)

        chunks[key] = value

        // ComfyUI stores workflow data in a chunk with key "workflow"
        if (key === "workflow") {
          try {
            workflow = JSON.parse(value)
          } catch (e) {
            console.error("Failed to parse workflow JSON:", e)
          }
        }

        // ComfyUI might store prompt data in various keys
        if (key === "prompt" || key === "parameters") {
          try {
            const promptData = JSON.parse(value)
            if (promptData.prompt) {
              prompt = promptData.prompt
            }
            if (promptData.negative_prompt || promptData.negativePrompt) {
              negativePrompt = promptData.negative_prompt || promptData.negativePrompt
            }

            // Extract other parameters
            const paramKeys = [
              "seed",
              "steps",
              "cfg",
              "sampler",
              "scheduler",
              "denoise",
              "width",
              "height",
              "model",
              "vae",
              "clip",
            ]

            paramKeys.forEach((paramKey) => {
              if (promptData[paramKey] !== undefined) {
                parameters[paramKey] = promptData[paramKey]
              }
            })
          } catch (e) {
            console.error("Failed to parse prompt data:", e)
          }
        }
      }

      // Skip to the next chunk
      offset += length + 4 // length + CRC
    }

    // Extract all text inputs from the workflow
    if (workflow) {
      const textInputs = extractAllTextInputs(workflow)

      // If we didn't find a main prompt but we have text inputs, use the first one
      if (!prompt && textInputs.length > 0) {
        prompt = textInputs[0].text
      }

      // Store all text inputs for display
      allTextInputs.push(...textInputs)
    }

    return {
      prompt,
      negativePrompt,
      parameters,
      workflow,
      chunks,
      allTextInputs,
    }
  }

  // Function to extract all text inputs from a workflow
  const extractAllTextInputs = (workflow: any): any[] => {
    const textInputs: any[] = []
    const nodes = workflow.nodes || []

    // Track which nodes are connected to positive/negative conditioning
    const conditioningConnections: Record<string, string> = {}

    // First pass: identify conditioning connections
    if (workflow.links) {
      workflow.links.forEach((link: any) => {
        // Format varies, handle both array and object formats
        const sourceNode = Array.isArray(link) ? link[1].toString() : link.from_node?.toString()
        const targetNode = Array.isArray(link) ? link[3].toString() : link.to_node?.toString()
        const sourceOutput = Array.isArray(link) ? link[2] : link.from_output
        const targetInput = Array.isArray(link) ? link[4] : link.to_input

        // Check if this is a connection to a conditioning input
        if (
          targetInput === "positive" ||
          targetInput === "negative" ||
          targetInput === "conditioning_1" ||
          targetInput === "conditioning_2"
        ) {
          conditioningConnections[sourceNode] = targetInput
        }
      })
    }

    // Second pass: extract text from nodes
    for (const node of nodes) {
      // Check for text input nodes
      if (
        node.type &&
        (node.type.includes("CLIPTextEncode") ||
          node.type.includes("Text") ||
          node.type.includes("Prompt") ||
          node.type.includes("String"))
      ) {
        // Get the text from widgets_values
        if (node.widgets_values && node.widgets_values.length > 0) {
          const text = node.widgets_values[0]
          if (text && typeof text === "string" && text.trim()) {
            // Determine if this is positive or negative based on connections
            const role = conditioningConnections[node.id.toString()] || "unknown"
            let type = "Other Text Input"

            if (role === "positive" || role === "conditioning_1") {
              type = "Positive Prompt"
            } else if (role === "negative" || role === "conditioning_2") {
              type = "Negative Prompt"
            } else if (node.type.includes("Regional")) {
              type = "Regional Prompt"
            } else if (node.type.includes("Style")) {
              type = "Style Prompt"
            }

            textInputs.push({
              nodeId: node.id,
              nodeType: node.type,
              text,
              type,
              role,
            })
          }
        }
      }

      // Also check for LoRA nodes which might have text parameters
      if (node.type && node.type.includes("LoRA")) {
        if (node.widgets_values && node.widgets_values.length > 0) {
          const loraName = node.widgets_values[0]
          if (loraName && typeof loraName === "string" && loraName.trim()) {
            textInputs.push({
              nodeId: node.id,
              nodeType: node.type,
              text: `LoRA: ${loraName}`,
              type: "LoRA",
              strength: node.widgets_values[1] || 1.0,
            })
          }
        }
      }
    }

    return textInputs
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        handleFileUpload(file)
      } else {
        setError("Please upload an image file")
      }
    }
  }

  const loadWorkflow = () => {
    if (!metadata?.workflow) return

    // In a real implementation, you would dispatch an event or use a callback
    // to load the workflow into the main application
    alert("This would load the extracted workflow into the analyzer")
  }

  const handleExport = () => {
    if (!metadata) return
    exportImageMetadata(metadata, "image-metadata")
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0])
          }
        }}
      />

      {!imageUrl && (
        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-900"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-200">Upload ComfyUI Image</h3>
          <p className="mt-1 text-sm text-gray-400">Drag and drop a ComfyUI-generated image here, or click to browse</p>
        </div>
      )}

      {error && <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-md">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-400">Extracting metadata...</span>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Uploaded Image</CardTitle>
              <CardDescription className="text-gray-400">
                {metadata?.dimensions
                  ? `${metadata.dimensions.width}×${metadata.dimensions.height}px`
                  : "Analyzing image..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square overflow-hidden rounded-md border border-gray-800">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Uploaded image"
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  onClick={() => {
                    setImageUrl(null)
                    setMetadata(null)
                    setParsedWorkflow(null)
                    setError(null)
                  }}
                >
                  Upload Another
                </Button>
                <div className="flex gap-2">
                  {metadata && (
                    <Button
                      variant="outline"
                      className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                      onClick={handleExport}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Metadata
                    </Button>
                  )}
                  {metadata?.workflow && (
                    <Button variant="default" className="bg-purple-700 hover:bg-purple-600" onClick={loadWorkflow}>
                      <FileJson className="mr-2 h-4 w-4" />
                      Load Workflow
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {metadata ? (
              <Tabs defaultValue="prompt" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="prompt" className="data-[state=active]:bg-gray-700">
                    Prompts
                  </TabsTrigger>
                  <TabsTrigger value="parameters" className="data-[state=active]:bg-gray-700">
                    Parameters
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="data-[state=active]:bg-gray-700">
                    Workflow
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prompt" className="mt-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Prompt Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metadata.allTextInputs && metadata.allTextInputs.length > 0 ? (
                        <div className="space-y-4">
                          {metadata.allTextInputs.map((input, index) => (
                            <div key={index}>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-400">{input.type}</h4>
                                <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700">
                                  {input.nodeType}
                                </Badge>
                              </div>
                              <div className="bg-gray-800 p-3 rounded-md text-gray-200 text-sm">{input.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : metadata.prompt ? (
                        <>
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Positive Prompt</h4>
                            <div className="bg-gray-800 p-3 rounded-md text-gray-200 text-sm">{metadata.prompt}</div>
                          </div>

                          {metadata.negativePrompt && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Negative Prompt</h4>
                              <div className="bg-gray-800 p-3 rounded-md text-gray-200 text-sm">
                                {metadata.negativePrompt}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          No prompt information found in image metadata
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="parameters" className="mt-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Generation Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metadata.parameters && Object.keys(metadata.parameters).length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(metadata.parameters).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-gray-800 p-2 rounded-md">
                              <span className="text-gray-400 text-xs">{key}:</span>
                              <div className="text-gray-200 text-sm font-medium truncate">{String(value)}</div>
                            </div>
                          ))}

                          {metadata.dimensions && (
                            <>
                              <div className="bg-gray-800 p-2 rounded-md">
                                <span className="text-gray-400 text-xs">width:</span>
                                <div className="text-gray-200 text-sm font-medium">{metadata.dimensions.width}px</div>
                              </div>
                              <div className="bg-gray-800 p-2 rounded-md">
                                <span className="text-gray-400 text-xs">height:</span>
                                <div className="text-gray-200 text-sm font-medium">{metadata.dimensions.height}px</div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          No generation parameters found in image metadata
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="workflow" className="mt-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Workflow Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metadata.workflow ? (
                        <div className="space-y-4">
                          {parsedWorkflow && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-purple-900">{parsedWorkflow.stats.totalNodes} Nodes</Badge>
                                <Badge className="bg-blue-900">{parsedWorkflow.stats.totalLinks} Connections</Badge>
                                <Badge className="bg-green-900">{parsedWorkflow.models.length} Models</Badge>
                                <Badge className="bg-yellow-900">
                                  {Object.keys(parsedWorkflow.stats.nodeTypes).length} Node Types
                                </Badge>
                              </div>

                              <div className="text-xs text-gray-400">
                                Click "Load Workflow" to analyze this workflow in detail
                              </div>
                            </div>
                          )}

                          <div className="relative">
                            <div className="absolute right-2 top-2 z-10">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                onClick={() => {
                                  // Copy workflow JSON to clipboard
                                  const json = JSON.stringify(metadata.workflow, null, 2)
                                  navigator.clipboard.writeText(json)
                                  alert("Workflow JSON copied to clipboard")
                                }}
                              >
                                <Code className="h-4 w-4" />
                                <span className="sr-only">Copy workflow JSON</span>
                              </Button>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-md text-gray-300 text-xs font-mono overflow-auto max-h-[300px]">
                              <pre>{JSON.stringify(metadata.workflow, null, 2)}</pre>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          No workflow data found in image metadata
                          <p className="mt-2 text-sm">
                            This image may not have been generated by ComfyUI, or the metadata may have been stripped.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-400 py-8">{error ? error : "Analyzing image metadata..."}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
