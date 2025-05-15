import type { Edge, Node } from "reactflow"

export function parseComfyWorkflow(workflow: any) {
  if (!workflow || !workflow.nodes) {
    return {
      graph: { nodes: [], edges: [] },
      models: [],
      nodeInfo: [],
      stats: {
        totalNodes: 0,
        totalLinks: 0,
        nodeTypes: {},
        nodeCategories: {},
      },
    }
  }

  // Extract nodes and convert to ReactFlow format
  const nodes: Node[] = workflow.nodes.map((node: any) => {
    return {
      id: node.id.toString(),
      position: { x: node.pos[0], y: node.pos[1] },
      data: {
        label: node.title || node.type,
        type: node.type,
        properties: node.properties,
        widgets: node.widgets_values,
        inputs: node.inputs,
        outputs: node.outputs,
      },
      type: "custom",
    }
  })

  // Extract edges and convert to ReactFlow format
  const edges: Edge[] = workflow.links.map((link: any) => {
    return {
      id: `e${link[0]}`,
      source: link[1].toString(),
      target: link[3].toString(),
      animated: true,
      style: { stroke: "#888" },
    }
  })

  // Extract model information
  const models = extractModelInfo(workflow)

  // Extract detailed node information
  const nodeInfo = extractNodeInfo(workflow)

  // Calculate statistics
  const stats = calculateStats(workflow)

  return {
    graph: { nodes, edges },
    models,
    nodeInfo,
    stats,
  }
}

// Update the extractModelInfo function to get more detailed information
function extractModelInfo(workflow: any) {
  const modelNodes = workflow.nodes.filter((node: any) => {
    const type = node.type?.toLowerCase() || ""
    return (
      type.includes("loader") ||
      type.includes("checkpoint") ||
      type.includes("model") ||
      type.includes("lora") ||
      type.includes("vae") ||
      type.includes("clip") ||
      type.includes("controlnet")
    )
  })

  const modelMap = new Map()

  modelNodes.forEach((node: any) => {
    let modelName = "Unknown Model"
    let modelType = "Unknown"
    let modelPath = undefined
    let modelVersion = undefined
    let modelFormat = undefined
    let modelSource = undefined

    // Try to determine model name and type
    if (node.widgets_values && node.widgets_values.length > 0) {
      modelName = node.widgets_values[0] !== null ? String(node.widgets_values[0]) : "Unknown Model"

      // Try to extract model format from filename
      if (typeof modelName === "string") {
        if (modelName.endsWith(".safetensors")) {
          modelFormat = "SafeTensors"
        } else if (modelName.endsWith(".ckpt")) {
          modelFormat = "Checkpoint"
        } else if (modelName.endsWith(".pt") || modelName.endsWith(".pth")) {
          modelFormat = "PyTorch"
        }

        // Try to extract version if it follows common patterns
        const versionMatch = modelName.match(/[vV](\d+(\.\d+)*)/)
        if (versionMatch) {
          modelVersion = versionMatch[0]
        }

        // Try to determine source based on common prefixes
        if (modelName.includes("sd_")) {
          modelSource = "Stable Diffusion"
        } else if (modelName.includes("flux")) {
          modelSource = "Flux"
        }
      }

      // If there's a second widget value and it's a precision setting
      if (node.widgets_values.length > 1 && typeof node.widgets_values[1] === "string") {
        const precisionValue = node.widgets_values[1]
        if (["fp16", "fp32", "bf16", "fp8_e4m3fn"].includes(precisionValue)) {
          modelFormat = `${modelFormat || ""} (${precisionValue})`.trim()
        }
      }
    }

    // Extract path if available in properties
    if (node.properties && node.properties.path) {
      modelPath = node.properties.path
    }

    if (node.type) {
      if (node.type.toLowerCase().includes("vae")) {
        modelType = "VAE"
      } else if (node.type.toLowerCase().includes("clip")) {
        modelType = "CLIP"
      } else if (node.type.toLowerCase().includes("lora")) {
        modelType = "LoRA"
      } else if (node.type.toLowerCase().includes("controlnet")) {
        modelType = "ControlNet"
      } else if (node.type.toLowerCase().includes("unet")) {
        modelType = "UNET"
      } else if (node.type.toLowerCase().includes("checkpoint")) {
        modelType = "Checkpoint"
      } else {
        modelType = node.type.replace("Loader", "")
      }
    }

    const key = `${modelType}:${modelName}`

    if (modelMap.has(key)) {
      const existing = modelMap.get(key)
      existing.count += 1
      if (!existing.nodes.includes(node.type)) {
        existing.nodes.push(node.type)
      }
    } else {
      modelMap.set(key, {
        name: modelName,
        type: modelType,
        path: modelPath,
        version: modelVersion,
        format: modelFormat,
        source: modelSource,
        count: 1,
        nodes: [node.type],
        nodeIds: [node.id.toString()],
      })
    }
  })

  return Array.from(modelMap.values())
}

// Add a new function to extract detailed node information
function extractNodeInfo(workflow: any) {
  const nodeInfo = workflow.nodes.map((node: any) => {
    // Extract input and output connections
    const inputs = (node.inputs || []).map((input: any) => ({
      name: input.name,
      type: input.type,
      connected: input.link !== null && input.link !== undefined,
    }))

    const outputs = (node.outputs || []).map((output: any) => ({
      name: output.name,
      type: output.type,
      connections: output.links ? output.links.length : 0,
    }))

    // Extract node metadata
    const metadata = {
      id: node.id.toString(),
      type: node.type,
      title: node.title || node.type,
      category: getCategoryForNode(node),
      position: node.pos ? { x: node.pos[0], y: node.pos[1] } : undefined,
      size: node.size ? { width: node.size[0], height: node.size[1] } : undefined,
      properties: node.properties || {},
      widgets: node.widgets_values || [],
      inputs,
      outputs,
      order: node.order,
    }

    return metadata
  })

  return nodeInfo
}

// Helper function to categorize nodes
function getCategoryForNode(node: any) {
  const type = node.type?.toLowerCase() || ""

  if (type.includes("load") || type.includes("loader")) {
    return "Loaders"
  } else if (type.includes("sampler") || type.includes("ksampler")) {
    return "Samplers"
  } else if (type.includes("vae")) {
    return "VAE"
  } else if (type.includes("clip")) {
    return "CLIP"
  } else if (type.includes("model") || type.includes("unet")) {
    return "Models"
  } else if (type.includes("image") || type.includes("img")) {
    return "Image Processing"
  } else if (type.includes("preview") || type.includes("save")) {
    return "Output"
  } else if (type.includes("layer") || type.includes("filter")) {
    return "Effects"
  } else if (type.includes("text") || type.includes("prompt")) {
    return "Text/Prompts"
  } else if (type.includes("controlnet")) {
    return "ControlNet"
  } else if (type.includes("lora")) {
    return "LoRA"
  }

  return "Other"
}

function calculateStats(workflow: any) {
  const totalNodes = workflow.nodes.length
  const totalLinks = workflow.links.length

  const nodeTypes: { [key: string]: number } = {}
  const nodeCategories: { [key: string]: number } = {}

  workflow.nodes.forEach((node: any) => {
    const type = node.type
    const category = getCategoryForNode(node)

    nodeTypes[type] = (nodeTypes[type] || 0) + 1
    nodeCategories[category] = (nodeCategories[category] || 0) + 1
  })

  return {
    totalNodes,
    totalLinks,
    nodeTypes,
    nodeCategories,
  }
}
