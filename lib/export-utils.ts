export function exportWorkflowData(data: any, filename: string) {
  // Create a formatted JSON with the analysis data
  const exportData = {
    workflow_analysis: {
      timestamp: new Date().toISOString(),
      statistics: data.stats,
      required_models: data.models.map((model: any) => ({
        name: model.name,
        type: model.type,
        path: model.path,
        version: model.version,
        format: model.format,
        source: model.source,
        usage_count: model.count,
        used_in_nodes: model.nodes,
      })),
      nodes: data.nodeInfo.map((node: any) => ({
        id: node.id,
        type: node.type,
        category: node.category,
        properties: node.properties,
        inputs: node.inputs,
        outputs: node.outputs,
        position: node.position,
        order: node.order,
      })),
      node_connections: data.graph.edges.map((edge: any) => ({
        from_node: edge.source,
        to_node: edge.target,
      })),
    },
  }

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportData, null, 2)

  // Create a blob and download link
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}-analysis.json`
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

export function exportImageMetadata(metadata: any, filename = "image-metadata") {
  // Create a formatted JSON with the metadata
  const exportData = {
    image_metadata: {
      timestamp: new Date().toISOString(),
      prompt: metadata.prompt,
      negative_prompt: metadata.negativePrompt,
      all_text_inputs: metadata.allTextInputs || [],
      parameters: metadata.parameters,
      dimensions: metadata.dimensions,
      workflow: metadata.workflow,
    },
  }

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportData, null, 2)

  // Create a blob and download link
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.json`
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
