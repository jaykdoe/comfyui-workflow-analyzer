"use client"

import { useEffect } from "react"
import ReactFlow, { Background, Controls, type NodeTypes, Panel, ReactFlowProvider, useReactFlow } from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize, Download } from "lucide-react"
import { CustomNode } from "./custom-node"

interface WorkflowVisualizerProps {
  data: any
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const FlowChart = ({ data }: { data: any }) => {
  const { nodes, edges } = data.graph
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 100)
  }, [fitView, nodes])

  const downloadImage = () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement
    if (!flowElement) return

    // Use html2canvas or similar library to capture the flow as an image
    // For simplicity, we're just showing an alert here
    alert("Download functionality would capture the current view as an image")
  }

  return (
    <>
      <Background color="#444" gap={16} />
      <Controls showInteractive={false} className="bg-gray-800 border-gray-700" />
      <Panel position="top-right" className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => zoomIn()}
          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => zoomOut()}
          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fitView({ padding: 0.2 })}
          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadImage}
          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
        >
          <Download className="h-4 w-4" />
        </Button>
      </Panel>
    </>
  )
}

export function WorkflowVisualizer({ data }: WorkflowVisualizerProps) {
  if (!data || !data.graph) {
    return <div>No workflow data available</div>
  }

  return (
    <div className="h-[70vh] border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
      <ReactFlowProvider>
        <ReactFlow
          nodes={data.graph.nodes}
          edges={data.graph.edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            style: { stroke: "#888" },
            animated: true,
          }}
          fitView
          attributionPosition="bottom-right"
        >
          <FlowChart data={data} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
