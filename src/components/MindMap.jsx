import { useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import QuestionNode from './QuestionNode'
import PastaNode from './PastaNode'
import { useLayoutNodes } from '../hooks/useLayoutNodes'

const nodeTypes = {
  question: QuestionNode,
  pasta: PastaNode,
}

function AutoFitView({ fitKey }) {
  const { fitView } = useReactFlow()
  const firstRenderRef = useRef(true)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fitView({
        duration: firstRenderRef.current ? 0 : 650,
        padding: 0.24,
        maxZoom: 1.15,
      })
      firstRenderRef.current = false
    })

    return () => window.cancelAnimationFrame(frame)
  }, [fitKey, fitView])

  return null
}

function MindMapCanvas(props) {
  const { nodes, edges, fitKey } = useLayoutNodes(props)

  function handleNodeClick(_, node) {
    node.data.onToggle()
  }

  return (
    <div className="absolute inset-0 z-[1] h-full w-full">
      <ReactFlow
        fitView
        edges={edges}
        nodes={nodes}
        nodeTypes={nodeTypes}
        style={{ width: '100%', height: '100%' }}
        minZoom={0.35}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <AutoFitView fitKey={fitKey} />
        <Background
          color="rgba(82, 101, 67, 0.12)"
          gap={28}
          size={1.25}
        />
        <Controls
          showInteractive={false}
          className="!overflow-hidden !rounded-2xl !border !border-white/70 !bg-white/85 !shadow-lg"
        />
      </ReactFlow>
    </div>
  )
}

function MindMap(props) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas {...props} />
    </ReactFlowProvider>
  )
}

export default MindMap
