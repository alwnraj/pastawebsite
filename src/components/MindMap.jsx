import { useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  getViewportForBounds,
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

const defaultEdgeOptions = {
  type: 'smoothstep',
}

const BRANCH_FOCUS_PADDING = 0.18
const BRANCH_FOCUS_ZOOM_FLOOR = 0.68
const ROOT_BRANCH_MIN_ZOOM = 0.35

function AutoViewport({ structureKey, focusKey, focusTarget, shouldFitStructure }) {
  const { fitView, getZoom, setCenter } = useReactFlow()
  const firstRenderRef = useRef(true)
  const focusTargetRef = useRef(null)

  useEffect(() => {
    focusTargetRef.current = focusTarget
  }, [focusTarget])

  useEffect(() => {
    if (!firstRenderRef.current && !shouldFitStructure) {
      return undefined
    }

    const frame = window.requestAnimationFrame(() => {
      fitView({
        duration: firstRenderRef.current ? 0 : 650,
        padding: 0.24,
        maxZoom: 1.15,
      })
      firstRenderRef.current = false
    })

    return () => window.cancelAnimationFrame(frame)
  }, [structureKey, fitView, shouldFitStructure])

  useEffect(() => {
    if (!focusKey || !focusTargetRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const target = focusTargetRef.current

      if (!target) {
        return
      }

      if (target.type === 'branch' && target.bounds) {
        const flowElement = document.querySelector('.react-flow')

        if (flowElement) {
          const currentZoom = getZoom()
          const { width, height } = flowElement.getBoundingClientRect()

          if (width > 0 && height > 0) {
            const targetViewport = getViewportForBounds(
              target.bounds,
              width,
              height,
              0.15,
              currentZoom,
              BRANCH_FOCUS_PADDING,
            )
            const minimumZoom =
              target.id === 'root'
                ? ROOT_BRANCH_MIN_ZOOM
                : currentZoom * BRANCH_FOCUS_ZOOM_FLOOR
            const zoom = Math.max(
              targetViewport.zoom,
              minimumZoom,
            )

            setCenter(target.x, target.y, {
              duration: 460,
              zoom,
            })
            return
          }
        }
      }

      setCenter(target.x, target.y, {
        duration: target.type === 'branch' ? 460 : 700,
        zoom: getZoom(),
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [focusKey, getZoom, setCenter])

  return null
}

function MindMapCanvas(props) {
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const { nodes, edges, structureKey, focusKey, focusTarget } = useLayoutNodes({
    ...props,
    hoveredNodeId,
  })
  const shouldFitStructure = props.visibleNodeIds.length === 1

  function handleNodeClick(_, node) {
    node.data.onToggle()
  }

  return (
    <div className="absolute inset-0 z-[1] h-full w-full">
      <ReactFlow
        edges={edges}
        nodes={nodes}
        nodeTypes={nodeTypes}
        style={{ width: '100%', height: '100%' }}
        minZoom={0.15}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onPaneClick={() => setHoveredNodeId(null)}
        zoomOnDoubleClick={false}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
      >
        <AutoViewport
          structureKey={structureKey}
          focusKey={focusKey}
          focusTarget={focusTarget}
          shouldFitStructure={shouldFitStructure}
        />
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
