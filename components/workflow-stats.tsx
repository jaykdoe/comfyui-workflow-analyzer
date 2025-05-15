import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Network, Layers, Cpu, Workflow } from "lucide-react"

interface WorkflowStatsProps {
  stats: {
    totalNodes: number
    totalLinks: number
    nodeTypes: Record<string, number>
    nodeCategories: Record<string, number>
  }
}

export function WorkflowStats({ stats }: WorkflowStatsProps) {
  if (!stats) {
    return <div className="text-center py-8 text-gray-400">No statistics available for this workflow</div>
  }

  const sortedNodeTypes = Object.entries(stats.nodeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const sortedNodeCategories = Object.entries(stats.nodeCategories).sort((a, b) => b[1] - a[1])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Total Nodes</CardTitle>
          <Layers className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalNodes}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Total Connections</CardTitle>
          <Network className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalLinks}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Node Types</CardTitle>
          <Cpu className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{Object.keys(stats.nodeTypes).length}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Categories</CardTitle>
          <Workflow className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{Object.keys(stats.nodeCategories).length}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Top Node Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedNodeTypes.map(([type, count]) => (
              <div key={type} className="flex items-center">
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full"
                    style={{ width: `${(count / stats.totalNodes) * 100}%` }}
                  ></div>
                </div>
                <div className="min-w-[30px] text-right text-xs font-medium text-gray-400 ml-2">{count}</div>
                <div className="min-w-[180px] text-xs text-gray-300 ml-2 truncate" title={type}>
                  {type}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Node Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {sortedNodeCategories.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                  <span className="text-sm text-gray-300">{category}</span>
                </div>
                <span className="text-sm font-medium text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
