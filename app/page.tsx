"use client"

import { useState, useRef, useEffect } from "react"
import { FileUploader } from "@/components/file-uploader"
import { WorkflowVisualizer } from "@/components/workflow-visualizer"
import { ModelList } from "@/components/model-list"
import { WorkflowStats } from "@/components/workflow-stats"
import { NodeList } from "@/components/node-list"
import { ImageMetadataExtractor } from "@/components/image-metadata-extractor"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileJson } from "lucide-react"
import { parseComfyWorkflow } from "@/lib/workflow-parser"
import { exportWorkflowData } from "@/lib/export-utils"

export default function ComfyUIAnalyzer() {
  const [workflow, setWorkflow] = useState<any>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("visualizer")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Parse the example workflow on initial load
    const fetchAndParseExample = async () => {
      try {
        const response = await fetch("/api/example-workflow")
        if (response.ok) {
          const data = await response.json()
          setWorkflow(data)
          const parsed = parseComfyWorkflow(data)
          setParsedData(parsed)
        }
      } catch (error) {
        console.error("Failed to load example workflow:", error)
      }
    }

    fetchAndParseExample()
  }, [])

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        setWorkflow(json)
        const parsed = parseComfyWorkflow(json)
        setParsedData(parsed)
      } catch (error) {
        console.error("Failed to parse workflow file:", error)
        alert("Invalid workflow file. Please upload a valid ComfyUI JSON file.")
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    if (!parsedData) return
    exportWorkflowData(parsedData, workflow?.filename || "workflow-analysis")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileJson className="h-6 w-6" />
            ComfyUI Workflow Analyzer
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            >
              Upload Workflow
            </Button>
            <Button
              variant="default"
              onClick={handleExport}
              disabled={!parsedData}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Analysis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <Tabs defaultValue="workflow" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="workflow" className="data-[state=active]:bg-gray-700">
              Workflow Analysis
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-gray-700">
              Image Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-4">
            <FileUploader onFileUpload={handleFileUpload} ref={fileInputRef} />

            {parsedData ? (
              <Tabs defaultValue="visualizer" className="mt-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                  <TabsTrigger value="visualizer" className="data-[state=active]:bg-gray-700">
                    Workflow Visualizer
                  </TabsTrigger>
                  <TabsTrigger value="models" className="data-[state=active]:bg-gray-700">
                    Required Models
                  </TabsTrigger>
                  <TabsTrigger value="nodes" className="data-[state=active]:bg-gray-700">
                    Nodes
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-gray-700">
                    Workflow Stats
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="visualizer" className="mt-4">
                  <WorkflowVisualizer data={parsedData} />
                </TabsContent>
                <TabsContent value="models" className="mt-4">
                  <ModelList models={parsedData.models} />
                </TabsContent>
                <TabsContent value="nodes" className="mt-4">
                  <NodeList nodes={parsedData.nodeInfo} />
                </TabsContent>
                <TabsContent value="stats" className="mt-4">
                  <WorkflowStats stats={parsedData.stats} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-64 mt-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading workflow data...</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <ImageMetadataExtractor />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-gray-800 py-4 bg-gray-900">
        <div className="container text-center text-gray-400 text-sm">
          <p>ComfyUI Workflow Analyzer - Analyze and extract data from ComfyUI workflow files and images</p>
        </div>
      </footer>
    </div>
  )
}
