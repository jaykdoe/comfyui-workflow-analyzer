import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

export const CustomNode = memo(({ data, isConnectable }: NodeProps) => {
  const getNodeColor = () => {
    const type = data.type?.toLowerCase() || ""

    if (type.includes("load") || type.includes("loader")) return "#4a5568"
    if (type.includes("sampler")) return "#553c9a"
    if (type.includes("vae")) return "#2b6cb0"
    if (type.includes("clip")) return "#2c7a7b"
    if (type.includes("model")) return "#805ad5"
    if (type.includes("image")) return "#3182ce"
    if (type.includes("preview")) return "#38a169"
    if (type.includes("save")) return "#dd6b20"
    if (type.includes("layer") || type.includes("filter")) return "#d53f8c"

    return "#4a5568"
  }

  return (
    <div
      className="px-4 py-2 rounded-md shadow-md border border-gray-700"
      style={{
        background: getNodeColor(),
        minWidth: "180px",
        maxWidth: "250px",
      }}
    >
      <div className="font-medium text-white truncate" title={data.label}>
        {data.label}
      </div>
      {data.type && (
        <div className="text-xs text-gray-300 opacity-80 truncate" title={data.type}>
          {data.type}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-gray-200 border-2 border-gray-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-gray-200 border-2 border-gray-700"
      />
    </div>
  )
})

CustomNode.displayName = "CustomNode"
